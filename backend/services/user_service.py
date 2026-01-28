import os
import shutil
import numpy as np
import cv2
from datetime import datetime
from .model_service import get_face_embedding
from ..database import add_user, update_user_embedding, delete_user_db
from ..utils.image_utils import extract_frames
from ..config import PROCESSED_DIR, RAW_VIDEOS_DIR, DATASETS_DIR

def enroll_new_user(user_id, full_name, video_file, model_id):
    os.makedirs(RAW_VIDEOS_DIR, exist_ok=True)
    video_path = os.path.join(RAW_VIDEOS_DIR, f"{user_id}.webm")
    video_file.save(video_path)

    user_processed_dir = os.path.join(PROCESSED_DIR, full_name)
    os.makedirs(user_processed_dir, exist_ok=True)

    add_user(user_id, full_name, video_path, datetime.now())
    
    try:
        frames_saved = extract_frames(video_path, user_processed_dir)
        embeddings = []
        for img_name in os.listdir(user_processed_dir):
            if img_name.endswith('.jpg'):
                img_path = os.path.join(user_processed_dir, img_name)
                img_cv = cv2.imread(img_path)
                if img_cv is not None:
                    emb = get_face_embedding(img_cv, model_id)
                    if emb is not None:
                        embeddings.append(emb)
        
        if embeddings:
            avg_embedding = np.mean(embeddings, axis=0)
            emb_str = ",".join(map(str, avg_embedding.tolist()))
            update_user_embedding(user_id, emb_str)
        return True, frames_saved, video_path
    except Exception as e:
        return False, 0, str(e)

def delete_user_files(user_id):
    from ..database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT full_name FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    full_name = user['full_name'] if user else None
    
    delete_user_db(user_id)
    raw_video = os.path.join(RAW_VIDEOS_DIR, f"{user_id}.webm")
    dataset_dir = os.path.join(DATASETS_DIR, user_id)
    
    if os.path.exists(raw_video):
        os.remove(raw_video)
    if os.path.exists(dataset_dir):
        shutil.rmtree(dataset_dir)
        
    if full_name:
        processed_dir = os.path.join(PROCESSED_DIR, full_name)
        if os.path.exists(processed_dir):
            shutil.rmtree(processed_dir)
            
    return True
