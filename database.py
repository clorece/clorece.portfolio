import sqlite3
import datetime
from typing import List, Tuple, Optional

DB_FILE = 'langy.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            points INTEGER DEFAULT 0,
            multiplier INTEGER DEFAULT 1,
            last_daily_date TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_user(user_id: str) -> Tuple[int, int, Optional[str]]:
    """Returns (points, multiplier, last_daily_date)."""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT points, multiplier, last_daily_date FROM users WHERE user_id = ?', (str(user_id),))
    row = c.fetchone()
    conn.close()
    
    if row:
        return row[0], row[1], row[2]
    return 0, 1, None

def evaluate_multiplier(multiplier: int, last_daily_date: Optional[str]) -> int:
    """Helper to check if a user kept their streak."""
    if not last_daily_date:
        return 1
        
    last_date_obj = datetime.datetime.fromisoformat(last_daily_date).date()
    diff = (datetime.datetime.now().date() - last_date_obj).days
    
    if diff == 1:
        return min(multiplier + 1, 7) # Cap at x7 multiplier
    elif diff == 0:
        return multiplier
    else:
        return 1

def reward_daily(user_id: str, base_points: int) -> Tuple[int, int, int]:
    """Updates user upon WIN. Returns (points_added, new_total, new_multiplier)."""
    now_date = datetime.datetime.now().date().isoformat()
    points, multiplier, last_daily_date = get_user(user_id)
    
    new_multiplier = evaluate_multiplier(multiplier, last_daily_date)
    points_earned = base_points * new_multiplier
    new_total = points + points_earned
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO users (user_id, points, multiplier, last_daily_date)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            points = excluded.points,
            multiplier = excluded.multiplier,
            last_daily_date = excluded.last_daily_date
    ''', (str(user_id), new_total, new_multiplier, now_date))
    conn.commit()
    conn.close()
    
    return points_earned, new_total, new_multiplier

def fail_daily(user_id: str) -> Tuple[int, int]:
    """Updates user upon FAIL. Returns (total_points, new_multiplier)."""
    now_date = datetime.datetime.now().date().isoformat()
    points, multiplier, last_daily_date = get_user(user_id)
    
    # Missing/failing the daily drops the streak back to base x1 multiplier
    new_multiplier = 1
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO users (user_id, points, multiplier, last_daily_date)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            multiplier = excluded.multiplier,
            last_daily_date = excluded.last_daily_date
    ''', (str(user_id), points, new_multiplier, now_date))
    conn.commit()
    conn.close()
    
    return points, new_multiplier

def can_do_daily(user_id: str) -> bool:
    """Checks if the user has already done a daily today."""
    _, _, last_daily_date = get_user(user_id)
    if not last_daily_date:
        return True
    last_date_obj = datetime.datetime.fromisoformat(last_daily_date).date()
    return last_date_obj < datetime.datetime.now().date()

def get_leaderboard(limit: int = 10) -> List[Tuple[str, int, int]]:
    """Returns a list of (user_id, points, multiplier) ordered by points."""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT user_id, points, multiplier FROM users ORDER BY points DESC LIMIT ?', (limit,))
    rows = c.fetchall()
    conn.close()
    return rows

init_db()
