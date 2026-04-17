import os
import asyncio
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from jose import jwt
from datetime import datetime, timedelta
import httpx
from dotenv import load_dotenv

import ml_assistant
import database
from bot import start_bot

load_dotenv()

app = FastAPI()

# Global HTTP client with a generous timeout for cloud environments (HF/Supabase)
httpx_client = httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=10.0))

# Configure CORS for your GitHub Pages URL later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this with your GitHub Pages URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from .env
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:10000/api/auth/callback")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"

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
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
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
    # Trigger all long-running tasks in the background
    # This allows FastAPI to start listening on port 7860 immediately
    asyncio.create_task(background_initialization())
    asyncio.create_task(start_bot())
    asyncio.create_task(db_heartbeat())
    print("[API LIVE] Port opened. App is live while resources load in background.")

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
        print(f"[ERROR] Token exchange timeout: {e}")
        raise HTTPException(status_code=504, detail="Connection to Discord timed out. Please try again.")

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
    return {
        "id": user_id,
        "username": user["username"],
        "avatar": user.get("avatar"),
        "points": points,
        "multiplier": multiplier,
        "can_do_daily": can_do_daily
    }

@app.get("/api/challenge")
async def get_challenge(language: str, category: str = "Word", word: Optional[str] = None, is_daily: bool = False, user = Depends(get_optional_user)):
    if is_daily:
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required for daily challenges.")
        if not database.can_do_daily(user["id"]):
            raise HTTPException(status_code=403, detail="Daily already completed today.")

    english_word, translated_word = await ml_assistant.generate_challenge(language, word, category)
    if english_word == "error":
        raise HTTPException(status_code=400, detail=translated_word)
    
    return {
        "english_word": english_word,
        "translated_word": translated_word,
        "meaning_hint": ml_assistant.get_meaning_hint(english_word),
        "language": language,
        "category": category
    }

@app.post("/api/grade")
async def grade_challenge(data: dict, user = Depends(get_optional_user)):
    language = data.get("language")
    original_english = data.get("original_english")
    user_input = data.get("user_input")
    is_daily = data.get("is_daily", False)
    category = data.get("category", "Word")
    is_inverse = data.get("is_inverse", False)

    is_correct, score, reason = await ml_assistant.process_user_input_and_grade(language, original_english, user_input, category)
    
    result = {
        "is_correct": is_correct,
        "score": score,
        "reason": reason,
        "expected": original_english
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
    # Returns the pre-fetched leaderboard cache for instant loading
    return database.get_leaderboard_cached()

@app.post("/api/leaderboard/refresh")
async def refresh_leaderboard(user = Depends(get_current_user)):
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
