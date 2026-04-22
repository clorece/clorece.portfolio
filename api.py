import os
import asyncio
import secrets
import time
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from jose import jwt, JWTError
from datetime import datetime, timedelta
import httpx
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

import ml_assistant
import database
from bot import start_bot

load_dotenv()

app = FastAPI()

# --- Rate Limiting ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})

# Global HTTP client initialized in startup for correct event-loop binding
httpx_client: httpx.AsyncClient = None

# --- CORS ---
# Restrict to known frontend origins. CORS_ORIGINS env var accepts comma-separated URLs.
_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:10000/api/auth/callback")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("FATAL: SECRET_KEY environment variable is not set! Refusing to start with an insecure default.")
ALGORITHM = "HS256"

# --- Server-Side Challenge Store ---
# Prevents grade tampering by storing challenge data server-side.
# The client receives a challenge_id and cannot forge the expected answer.
_challenge_store: dict = {}
_CHALLENGE_TTL = 300  # 5 minutes

def _cleanup_expired_challenges():
    """Removes expired challenges to prevent memory leaks."""
    now = time.time()
    expired = [k for k, v in _challenge_store.items() if now - v["created_at"] > _CHALLENGE_TTL]
    for k in expired:
        del _challenge_store[k]

def store_challenge(data: dict) -> str:
    """Stores challenge data and returns a secure, unguessable challenge_id."""
    _cleanup_expired_challenges()
    challenge_id = secrets.token_urlsafe(32)
    _challenge_store[challenge_id] = {
        **data,
        "created_at": time.time()
    }
    return challenge_id

def consume_challenge(challenge_id: str) -> Optional[dict]:
    """Gets and removes a challenge (one-time use to prevent replay attacks)."""
    data = _challenge_store.pop(challenge_id, None)
    if not data:
        return None
    if time.time() - data["created_at"] > _CHALLENGE_TTL:
        return None  # Expired
    return data

# --- Pydantic Models for Input Validation ---
class GradeRequest(BaseModel):
    challenge_id: str = Field(..., max_length=100)
    user_input: str = Field(..., min_length=1, max_length=1000)
    is_daily: bool = False
    is_inverse: bool = False

# Helper for JWT
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (JWTError, KeyError, ValueError) as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (JWTError, KeyError, ValueError):
        return None

async def background_initialization():
    """Handles heavy loading in the background to avoid blocking Hugging Face startup."""
    print("[INIT] Background initialization started...")
    try:
        # 1. Initialize DB Pool
        database.init_pool()
        # 2. Initial cache populate (this will happen once pool is ready)
        database.refresh_leaderboard_cache(force=True)
    except Exception as e:
        print(f"[ERROR] DB background init error: {e}")
        
    try:
        # 3. Pre-load ML model
        print("[ML] Pre-loading ML model in background...")
        ml_assistant.get_model()
        print("[SUCCESS] ML model loaded in background.")
    except Exception as e:
        print(f"[ERROR] Model background init error: {e}")

@app.on_event("startup")
async def startup_event():
    global httpx_client
    # Initialize with improved timeout and environment trust (proxies)
    httpx_client = httpx.AsyncClient(
        timeout=httpx.Timeout(40.0, connect=15.0),
        trust_env=True,
        follow_redirects=True
    )
    
    # Trigger all long-running tasks in the background
    asyncio.create_task(background_initialization())
    asyncio.create_task(start_bot())
    asyncio.create_task(db_heartbeat())
    print("[API LIVE] Port opened. App is live while resources load in background.")

@app.get("/api/health/discord")
async def check_discord_health():
    """Diagnostic endpoint to verify if the server can reach Discord."""
    if not httpx_client:
        return {"status": "initializing"}
    try:
        start_time = time.time()
        # Testing a lightweight endpoint
        res = await httpx_client.get("https://discord.com/api/v10/gateway", timeout=15.0)
        return {
            "status": "connected" if res.status_code == 200 else "degraded",
            "http_code": res.status_code,
            "latency_ms": int((time.time() - start_time) * 1000),
            "server_time": res.headers.get("Date")
        }
    except Exception as e:
        import traceback
        print(f"[HEALTH CHECK FAILED] {e}")
        return {
            "status": "failed",
            "error_type": type(e).__name__,
            "error_detail": str(e),
            "traceback": traceback.format_exc() if os.getenv("DEBUG") else None
        }

@app.on_event("shutdown")
async def shutdown_event():
    # Cleanly close the global HTTP client
    await httpx_client.aclose()

async def db_heartbeat():
    """Refreshes the leaderboard cache every 6 hours to provide a 'meaningful' use of the database connection (Keep-Alive)."""
    while True:
        try:
            database.refresh_leaderboard_cache(force=True)
            print("[HEARTBEAT] Database heartbeat/cache refresh successful.")
        except Exception as e:
            print(f"[HEARTBEAT FAILED] Heartbeat failed: {e}")
        await asyncio.sleep(21600) # Wait 6 hours (6 * 3600)

@app.get("/api/auth/login")
async def login():
    discord_url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify"
    )
    return RedirectResponse(discord_url)

@app.get("/api/config")
async def get_config():
    """Returns public configuration needed by the frontend."""
    return {
        "clientId": DISCORD_CLIENT_ID
    }

async def get_discord_user(access_token: str):
    # Fetch user data using global client
    try:
        res = await httpx_client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        return res.json()
    except Exception as e:
        print(f"[ERROR] Discord user fetch timeout: {e}")
        return None

@app.get("/api/auth/callback")
async def callback(code: str):
    # Exchange code for access token using global client
    try:
        token_res = await httpx_client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = token_res.json()
    except Exception as e:
        import traceback
        print(f"[ERROR] Token exchange failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=504, detail=f"Connection to Discord timed out ({type(e).__name__}). Please try again.")

    if "access_token" not in token_data:
            print(f"Discord Token Error: {token_data}") # This will show up in Hugging Face Logs
            return {"error": f"Discord Auth Failed: {token_data.get('error_description', token_data.get('error', 'Unknown Error'))}"}

    user_data = await get_discord_user(token_data["access_token"])
    if not user_data:
        return {"error": "Failed to fetch user data from Discord"}
        
    # Create local JWT
    access_token = create_access_token({
        "id": user_data["id"],
        "username": user_data["username"],
        "avatar": user_data.get("avatar")
    })
    
    # Redirect back to your GitHub Pages portfolio using HashRouter
    # Redirect back to your GitHub Pages portfolio using HashRouter
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(f"{frontend_url}/#/langy?token={access_token}")

@app.get("/api/user/stats")
async def get_stats(user = Depends(get_current_user)):
    user_id = user["id"]
    points, multiplier, last_daily = database.get_user(user_id)
    can_do_daily = database.can_do_daily(user_id)
    rank = database.get_user_rank(user_id)
    
    # Evaluate the active multiplier (prospective if daily is available)
    active_multiplier = database.evaluate_multiplier(multiplier, last_daily)
    
    return {
        "id": user_id,
        "username": user["username"],
        "avatar": user.get("avatar"),
        "points": points,
        "multiplier": active_multiplier,
        "can_do_daily": can_do_daily,
        "rank": rank
    }

@app.get("/api/challenge")
@limiter.limit("15/minute")
async def get_challenge(request: Request, language: str, category: str = "Word", word: Optional[str] = None, is_daily: bool = False, user = Depends(get_optional_user)):
    if is_daily:
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required for daily challenges.")
        if not database.can_do_daily(user["id"]):
            raise HTTPException(status_code=403, detail="Daily already completed today.")

    english_word, translated_word, example_sentence_en, example_sentence_native = await ml_assistant.generate_challenge(language, word, category)
    if english_word == "error":
        raise HTTPException(status_code=400, detail=translated_word)
    
    # Store challenge server-side so the client cannot tamper with the expected answer
    challenge_id = store_challenge({
        "english_word": english_word,
        "translated_word": translated_word,
        "language": language,
        "category": category
    })
    
    return {
        "challenge_id": challenge_id,
        "english_word": english_word,
        "translated_word": translated_word,
        "meaning_hint": ml_assistant.get_meaning_hint(english_word),
        "example_sentence_en": example_sentence_en,
        "example_sentence_native": example_sentence_native,
        "language": language,
        "category": category
    }

@app.post("/api/grade")
@limiter.limit("15/minute")
async def grade_challenge(request: Request, data: GradeRequest, user = Depends(get_optional_user)):
    # Look up stored challenge — prevents the client from forging the expected answer
    challenge_data = consume_challenge(data.challenge_id)
    if not challenge_data:
        raise HTTPException(status_code=400, detail="Invalid or expired challenge. Please start a new one.")
    
    language = challenge_data["language"]
    original_english = challenge_data["english_word"]
    translated_word = challenge_data["translated_word"]
    category = challenge_data["category"]
    user_input = data.user_input
    is_daily = data.is_daily

    is_correct, score, reason = await ml_assistant.process_user_input_and_grade(language, original_english, user_input, category)
    
    result = {
        "is_correct": is_correct,
        "score": score,
        "reason": reason,
        "expected": original_english,
        "translated_word": translated_word
    }

    # Only process database updates if user is authenticated
    if user:
        user_id = user["id"]
        username = user.get("username")
        avatar = user.get("avatar")
        
        # Sync metadata
        database.update_user_metadata(user_id, username, avatar)

        try:
            if is_correct:
                if is_daily:
                    if database.can_do_daily(user_id):
                        base_points = 15 if category == "Word" else 30
                        earned, total, streak = database.reward_daily(user_id, base_points, username, avatar)
                        result.update({"earned": earned, "total": total, "streak": streak})
                    else:
                        result.update({"error": "Daily already completed today."})
            else:
                if is_daily:
                    if database.can_do_daily(user_id):
                        total, streak = database.fail_daily(user_id, username, avatar)
                        result.update({"total": total, "streak": streak})
                    else:
                        result.update({"error": "Daily already completed today. Streak not affected."})
        except Exception as e:
            print(f"[ERROR] Database error during grading: {e}")
            result.update({"error": "Database error: Points/streak could not be updated."})

    return result

@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10):
    limit = min(max(limit, 1), 50)  # Cap between 1 and 50
    # Returns the pre-fetched leaderboard cache for instant loading
    return database.get_leaderboard_cached()

@app.post("/api/leaderboard/refresh")
@limiter.limit("5/minute")
async def refresh_leaderboard(request: Request, user = Depends(get_current_user)):
    # Forces a database re-query and updates the global cache (Auth required)
    database.refresh_leaderboard_cache()
    return database.get_leaderboard_cached()

@app.get("/api/languages")
async def get_languages():
    try:
        # Return only the languages we have specialist tools for
        langs = sorted([l.capitalize() for l in ml_assistant.SUPPORTED_LANGUAGES])
        return langs
    except Exception as e:
        return ["Spanish", "French", "Japanese", "German", "Italian", "Korean", "Chinese", "Russian"]

if __name__ == "__main__":
    import uvicorn
    # Hugging Face uses port 7860 by default
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
