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

@app.on_event("startup")
async def startup_event():
    # Initialize database pool
    database.init_pool()
    # Load ML model on start
    print("Pre-loading ML model...")
    ml_assistant.get_model()
    # Start the Discord bot as a background task
    print("Launching Discord bot...")
    asyncio.create_task(start_bot())
    # Start the Database Keep-Alive task
    asyncio.create_task(db_heartbeat())

async def db_heartbeat():
    """Pings the database every 24 hours to prevent Supabase from pausing."""
    while True:
        try:
            database.get_leaderboard(1)
            print("💓 Database heartbeat successful.")
        except Exception as e:
            print(f"💔 Heartbeat failed: {e}")
        await asyncio.sleep(86400) # Wait 24 hours

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

@app.get("/api/auth/callback")
async def callback(code: str):
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_res = await client.post(
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
        if "access_token" not in token_data:
            print(f"Discord Token Error: {token_data}") # This will show up in Hugging Face Logs
            return {"error": f"Discord Auth Failed: {token_data.get('error_description', token_data.get('error', 'Unknown Error'))}"}

        # Get user info
        user_res = await client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        user_data = user_res.json()
        
    # Create local JWT
    access_token = create_access_token({
        "id": user_data["id"],
        "username": user_data["username"],
        "avatar": user_data.get("avatar")
    })
    
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
async def get_challenge(language: str, category: str = "Word", word: Optional[str] = None):
    english_word, translated_word = ml_assistant.generate_challenge(language, word, category)
    if english_word == "error":
        raise HTTPException(status_code=400, detail=translated_word)
    
    return {
        "english_word": english_word,
        "translated_word": translated_word,
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

    is_correct, score, reason = ml_assistant.process_user_input_and_grade(language, original_english, user_input, category)
    
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
                    total, streak = database.fail_daily(user_id, username, avatar)
                    result.update({"total": total, "streak": streak})
        except Exception as e:
            print(f"❌ Database error during grading: {e}")
            result.update({"error": "Database error: Points/streak could not be updated."})

    return result

@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10):
    return database.get_leaderboard(limit)

@app.get("/api/languages")
async def get_languages():
    try:
        from deep_translator import GoogleTranslator
        langs = GoogleTranslator().get_supported_languages()
        # Return as title case for better UI
        return [l.title() for l in langs]
    except Exception as e:
        return ["Spanish", "French", "Japanese", "German", "Italian", "Korean", "Chinese", "Russian"]

if __name__ == "__main__":
    import uvicorn
    # Hugging Face uses port 7860 by default
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
