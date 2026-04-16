import os
import psycopg2
from psycopg2 import pool
import datetime
from typing import List, Tuple, Optional
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
connection_pool = None

def init_db():
    if not connection_pool: 
        print("⚠️ No connection pool available to initialize database.")
        return
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    points INTEGER DEFAULT 0,
                    multiplier INTEGER DEFAULT 1,
                    last_daily_date TEXT,
                    username TEXT,
                    avatar TEXT
                )
            ''')
            c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT")
            c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT")
            
            # Enable RLS as per Supabase security recommendations
            try:
                c.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
                # Note: 'postgres' role (used by DATABASE_URL) bypasses RLS by default.
            except Exception as e:
                print(f"ℹ️ Note on RLS: {e}")
                
            conn.commit()
            print("✅ Database tables initialized and RLS enabled.")
    except Exception as e:
        print(f"❌ Error initializing database tables: {e}")
    finally:
        if conn: connection_pool.putconn(conn)

def init_pool():
    global connection_pool
    if not DATABASE_URL: 
        print("❌ DATABASE_URL environment variable is MISSING!")
        return
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
        print("🌐 Database connection pool initialized.")
        init_db()
    except Exception as e:
        print(f"❌ Failed to initialize connection pool: {e}")
        connection_pool = None

def update_user_metadata(user_id: str, username: str, avatar: str):
    """Ensures username and avatar are always up to date in the DB."""
    if not connection_pool: 
        raise Exception("Database connection not available.")
    if not username: return
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('''
                INSERT INTO users (user_id, username, avatar)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    avatar = EXCLUDED.avatar
            ''', (str(user_id), username, avatar))
            conn.commit()
    finally:
        if conn: connection_pool.putconn(conn)

def get_user(user_id: str) -> Tuple[int, int, Optional[str]]:
    if not connection_pool: 
        return 0, 1, None
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('SELECT points, multiplier, last_daily_date FROM users WHERE user_id = %s', (str(user_id),))
            row = c.fetchone()
            return row if row else (0, 1, None)
    finally:
        if conn: connection_pool.putconn(conn)

def evaluate_multiplier(multiplier: int, last_daily_date: Optional[str]) -> int:
    if not last_daily_date: return 1
    try:
        last_date_obj = datetime.datetime.fromisoformat(last_daily_date).date()
        diff = (datetime.datetime.now().date() - last_date_obj).days
        if diff == 1: return min(multiplier + 1, 7)
        elif diff == 0: return multiplier
        else: return 1
    except:
        return 1

import time

# Global Leaderboard Cache
_leaderboard_cache = []
_last_refresh_time = 0

def refresh_leaderboard_cache(limit: int = 10, force: bool = False):
    """Fetches the latest data and updates the in-memory cache, with a 30s global cooldown."""
    global _leaderboard_cache, _last_refresh_time
    
    # 30-second cooldown to prevent database spam
    now = time.time()
    if not force and (now - _last_refresh_time < 30):
        # We skip the DB query if it's too frequent
        return

    try:
        data = get_leaderboard(limit)
        if data:
            _leaderboard_cache = data
            _last_refresh_time = now
            print(f"📊 Leaderboard cache refreshed ({len(data)} users).")
    except Exception as e:
        print(f"❌ Failed to refresh leaderboard cache: {e}")

def get_leaderboard_cached():
    """Returns the pre-fetched leaderboard and the last refresh timestamp."""
    return {
        "players": _leaderboard_cache,
        "last_refresh": _last_refresh_time
    }

def reward_daily(user_id: str, base_points: int, username: str = None, avatar: str = None) -> Tuple[int, int, int]:
    now_date = datetime.datetime.now().date().isoformat()
    points, multiplier, last_daily_date = get_user(user_id)
    new_multiplier = evaluate_multiplier(multiplier, last_daily_date)
    points_earned = base_points * new_multiplier
    new_total = points + points_earned
    
    if not connection_pool: 
        raise Exception("Database connection not available. Points not saved.")
        
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('''
                INSERT INTO users (user_id, points, multiplier, last_daily_date, username, avatar)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    points = EXCLUDED.points,
                    multiplier = EXCLUDED.multiplier,
                    last_daily_date = EXCLUDED.last_daily_date,
                    username = EXCLUDED.username,
                    avatar = EXCLUDED.avatar
            ''', (str(user_id), new_total, new_multiplier, now_date, username, avatar))
            conn.commit()
            
            # Immediately trigger a cache refresh so the user sees their new ranking
            refresh_leaderboard_cache(force=True)
            
            return points_earned, new_total, new_multiplier
    finally:
        if conn: connection_pool.putconn(conn)

def fail_daily(user_id: str, username: str = None, avatar: str = None) -> Tuple[int, int]:
    now_date = datetime.datetime.now().date().isoformat()
    points, multiplier, last_daily_date = get_user(user_id)
    
    if not connection_pool: 
        raise Exception("Database connection not available. Streak not updated.")
        
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('''
                INSERT INTO users (user_id, points, multiplier, last_daily_date, username, avatar)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    multiplier = 1,
                    last_daily_date = EXCLUDED.last_daily_date,
                    username = EXCLUDED.username,
                    avatar = EXCLUDED.avatar
            ''', (str(user_id), points, 1, now_date, username, avatar))
            conn.commit()
            
            # Refresh cache after streak reset (though points didn't change, metadata might have)
            refresh_leaderboard_cache(force=True)
            
            return points, 1
    finally:
        if conn: connection_pool.putconn(conn)

def can_do_daily(user_id: str) -> bool:
    _, _, last_daily_date = get_user(user_id)
    if not last_daily_date: return True
    return datetime.datetime.fromisoformat(last_daily_date).date() < datetime.datetime.now().date()

def get_leaderboard(limit: int = 10) -> List[Tuple[str, int, int, str, str]]:
    if not connection_pool: return []
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('SELECT user_id, points, multiplier, username, avatar FROM users ORDER BY points DESC LIMIT %s', (limit,))
            return c.fetchall()
    finally:
        if conn: connection_pool.putconn(conn)

init_pool()
# Initial cache population
refresh_leaderboard_cache()
