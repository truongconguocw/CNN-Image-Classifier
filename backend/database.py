import sqlite3
from .config import DATABASE_PATH

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE,
            full_name TEXT,
            video_path TEXT,
            embedding TEXT,
            created_at DATETIME
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

def get_class_names():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT full_name FROM users ORDER BY user_id')
        names = [row['full_name'] for row in cursor.fetchall()]
        conn.close()
        return names if names else ['Benzema', 'Messi', 'Ronaldo']
    except:
        return ['Benzema', 'Messi', 'Ronaldo']

def add_user(user_id, full_name, video_path, created_at):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO users (user_id, full_name, video_path, created_at)
        VALUES (?, ?, ?, ?)
    ''', (user_id, full_name, video_path, created_at))
    conn.commit()
    conn.close()

def update_user_embedding(user_id, embedding_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET embedding = ? WHERE user_id = ?', (embedding_str, user_id))
    conn.commit()
    conn.close()

def delete_user_db(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()
