import os
import psycopg2
from psycopg2 import pool
import datetime
from typing import List, Tuple, Optional
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
connection_pool = None

def init_pool():
    global connection_pool
    if not DATABASE_URL:
        print("❌ DATABASE_URL is missing from environment variables!")
        return

    try:
        # We use SimpleConnectionPool to manage connections
        connection_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
        print("✅ Database connection pool established.")
    except Exception as e:
        print(f"❌ FAILED to connect to database: {e}")
        connection_pool = None

def get_user(user_id: str) -> Tuple[int, int, Optional[str]]:
    if not connection_pool:
        return 0, 1, None
        
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('SELECT points, multiplier, last_daily_date FROM users WHERE user_id = %s', (str(user_id),))
            row = c.fetchone()
            if row:
                return row[0], row[1], row[2]
            return 0, 1, None
    except Exception as e:
        print(f"Database error in get_user: {e}")
        return 0, 1, None
    finally:
        if conn:
            connection_pool.putconn(conn)

def evaluate_multiplier(multiplier: int, last_daily_date: Optional[str]) -> int:
    if not last_daily_date:
        return 1
    last_date_obj = datetime.datetime.fromisoformat(last_daily_date).date()
    diff = (datetime.datetime.now().date() - last_date_obj).days
    if diff == 1:
        return min(multiplier + 1, 7)
    elif diff == 0:
        return multiplier
    else:
        return 1

def reward_daily(user_id: str, base_points: int) -> Tuple[int, int, int]:
    now_date = datetime.datetime.now().date().isoformat()
    points, multiplier, last_daily_date = get_user(user_id)
    new_multiplier = evaluate_multiplier(multiplier, last_daily_date)
    points_earned = base_points * new_multiplier
    new_total = points + points_earned
    
    if not connection_pool:
        return points_earned, new_total, new_multiplier

    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('''
                INSERT INTO users (user_id, points, multiplier, last_daily_date)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    points = EXCLUDED.points,
                    multiplier = EXCLUDED.multiplier,
                    last_daily_date = EXCLUDED.last_daily_date
            ''', (str(user_id), new_total, new_multiplier, now_date))
            conn.commit()
            return points_earned, new_total, new_multiplier
    except Exception as e:
        print(f"Database error in reward_daily: {e}")
        return points_earned, new_total, new_multiplier
    finally:
        if conn:
            connection_pool.putconn(conn)

def fail_daily(user_id: str) -> Tuple[int, int]:
    now_date = datetime.datetime.now().date().isoformat()
    points, multiplier, last_daily_date = get_user(user_id)
    new_multiplier = 1
    
    if not connection_pool:
        return points, new_multiplier

    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('''
                INSERT INTO users (user_id, points, multiplier, last_daily_date)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    multiplier = EXCLUDED.multiplier,
                    last_daily_date = EXCLUDED.last_daily_date
            ''', (str(user_id), points, new_multiplier, now_date))
            conn.commit()
            return points, new_multiplier
    except Exception as e:
        print(f"Database error in fail_daily: {e}")
        return points, new_multiplier
    finally:
        if conn:
            connection_pool.putconn(conn)

def can_do_daily(user_id: str) -> bool:
    _, _, last_daily_date = get_user(user_id)
    if not last_daily_date:
        return True
    last_date_obj = datetime.datetime.fromisoformat(last_daily_date).date()
    return last_date_obj < datetime.datetime.now().date()

def get_leaderboard(limit: int = 10) -> List[Tuple[str, int, int]]:
    if not connection_pool:
        return []
        
    conn = None
    try:
        conn = connection_pool.getconn()
        with conn.cursor() as c:
            c.execute('SELECT user_id, points, multiplier FROM users ORDER BY points DESC LIMIT %s', (limit,))
            return c.fetchall()
    except Exception as e:
        print(f"Database error in get_leaderboard: {e}")
        return []
    finally:
        if conn:
            connection_pool.putconn(conn)

# Initialize pool on load
init_pool()
