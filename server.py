import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import shutil
from PIL import Image
import io
import cv2
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

MODELS_DIR = 'models'
MODELS_CONFIG = {
    'vgg16': {
        'path': 'models/vgg16_best_fold_3.h5',
        'name': 'VGG16 (Transfer Learning)',
        'preprocess': 'vgg16'
    },
    'custom_cnn': {
        'path': 'models/custom_cnn_fold_4.h5',
        'name': 'Custom CNN (Lightweight)',
        'preprocess': 'rescale'
    }
}

IMG_SIZE = (224, 224)
CLASS_NAMES = ['Benzema', 'Messi', 'Ronaldo']
active_model_id = 'vgg16'
loaded_models = {}

def init_db():
    conn = sqlite3.connect('faceid.db')
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

init_db()

def load_model(model_id):
    if model_id in loaded_models:
        return loaded_models[model_id]
    
    config = MODELS_CONFIG.get(model_id)
    if not config or not os.path.exists(config['path']):
        return None
    
    print(f"Loading model {model_id} from {config['path']}...")
    model = tf.keras.models.load_model(config['path'])
    loaded_models[model_id] = model
    return model

load_model(active_model_id)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')

def detect_head_pose(img_cv):
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    if len(faces) > 0:
        return "frontal"
    
    profiles = profile_cascade.detectMultiScale(gray, 1.1, 5)
    if len(profiles) > 0:
        return "right"
        
    flipped_gray = cv2.flip(gray, 1)
    profiles_flipped = profile_cascade.detectMultiScale(flipped_gray, 1.1, 5)
    if len(profiles_flipped) > 0:
        return "left"
        
    return "unknown"

def preprocess_face(face_img, model_id):
    img_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
    img = Image.fromarray(img_rgb).resize(IMG_SIZE)
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    
    config = MODELS_CONFIG.get(model_id)
    if config['preprocess'] == 'vgg16':
        img_array = tf.keras.applications.vgg16.preprocess_input(img_array)
    else:
        img_array = img_array.astype('float32') / 255.0
        
    return img_array

def get_embedding(img_cv, model_id):
    model = load_model(model_id)
    if not model:
        return None
    
    intermediate_model = tf.keras.Model(inputs=model.input, outputs=model.layers[-2].output)
    
    processed = preprocess_face(img_cv, model_id)
    embedding = intermediate_model.predict(processed)
    return embedding[0]

def apply_nms(detections, iou_threshold=0.3):
    if len(detections) == 0:
        return []
    detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
    
    final_detections = []
    
    while len(detections) > 0:
        best_box = detections.pop(0)
        final_detections.append(best_box)

        remaining = []
        for box in detections:
            x1_a, y1_a, w_a, h_a = best_box['bbox']
            x1_b, y1_b, w_b, h_b = box['bbox']

            xA = max(x1_a, x1_b)
            yA = max(y1_a, y1_b)
            xB = min(x1_a + w_a, x1_b + w_b)
            yB = min(y1_a + h_a, y1_b + h_b)
            
            inter_width = max(0, xB - xA)
            inter_height = max(0, yB - yA)
            inter_area = inter_width * inter_height

            box_a_area = w_a * h_a
            box_b_area = w_b * h_b
            union_area = box_a_area + box_b_area - inter_area
            iou = inter_area / union_area if union_area > 0 else 0
            if iou < iou_threshold:
                remaining.append(box)
        
        detections = remaining
        
    return final_detections

@app.route('/api/models', methods=['GET'])
def get_models():
    return jsonify({
        'active_model': active_model_id,
        'available_models': [{'id': k, 'name': v['name'], 'exists': os.path.exists(v['path'])} for k, v in MODELS_CONFIG.items()]
    })

@app.route('/api/select_model', methods=['POST'])
def select_model():
    global active_model_id
    data = request.json
    model_id = data.get('model_id')
    
    if model_id not in MODELS_CONFIG:
        return jsonify({'error': 'Invalid model ID'}), 400
    
    if not os.path.exists(MODELS_CONFIG[model_id]['path']):
        return jsonify({'error': f'Model file not found: {MODELS_CONFIG[model_id]["path"]}'}), 404
    
    if load_model(model_id):
        active_model_id = model_id
        return jsonify({'success': True, 'active_model': active_model_id})
    else:
        return jsonify({'error': 'Failed to load model'}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    model = load_model(active_model_id)
    if not model:
        return jsonify({'error': 'Active model not loaded'}), 500
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    img_bytes = file.read()
    
    try:
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        
        raw_results = [] 
        if len(faces) == 0:
            processed = preprocess_face(img_cv, active_model_id)
            preds = model.predict(processed)
            class_idx = np.argmax(preds[0])
            confidence = float(preds[0][class_idx]) * 100
            if confidence > 70.0:
                raw_results.append({
                    'bbox': [0, 0, img_cv.shape[1], img_cv.shape[0]],
                    'prediction': CLASS_NAMES[class_idx],
                    'confidence': round(confidence, 2)
                })
        else:
            for (x, y, w, h) in faces:
                face_img = img_cv[y:y+h, x:x+w]
                processed = preprocess_face(face_img, active_model_id)
                preds = model.predict(processed)
                class_idx = np.argmax(preds[0])
                confidence = float(preds[0][class_idx]) * 100

                if confidence > 70.0:
                    raw_results.append({
                        'bbox': [int(x), int(y), int(w), int(h)],
                        'prediction': CLASS_NAMES[class_idx],
                        'confidence': round(confidence, 2)
                    })
        clean_results = apply_nms(raw_results, iou_threshold=0.3)
        return jsonify({'detections': clean_results, 'model_used': active_model_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate-face', methods=['POST'])
def validate_face():
    if 'file' not in request.files:
        return jsonify({'valid': False, 'message': 'No file uploaded'}), 400
    
    file = request.files['file']
    nparr = np.frombuffer(file.read(), np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    if len(faces) > 0:
        return jsonify({'valid': True, 'message': 'Human face detected'})
    
    return jsonify({'valid': False, 'message': 'No human face detected'})

@app.route('/api/detect-pose', methods=['POST'])
def detect_pose_api():
    if 'file' not in request.files:
        return jsonify({'pose': 'unknown'}), 400
    
    file = request.files['file']
    nparr = np.frombuffer(file.read(), np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    pose = detect_head_pose(img_cv)
    return jsonify({'pose': pose})

@app.route('/api/predict-vector', methods=['POST'])
def predict_vector():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    nparr = np.frombuffer(file.read(), np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    if len(faces) == 0:
        return jsonify({'detections': [], 'message': 'No face detected'})

    conn = sqlite3.connect('faceid.db')
    cursor = conn.cursor()
    cursor.execute('SELECT user_id, full_name, embedding FROM users WHERE embedding IS NOT NULL')
    db_users = cursor.fetchall()
    conn.close()

    results = []
    for (x, y, w, h) in faces:
        face_img = img_cv[y:y+h, x:x+w]
        face_img = cv2.resize(face_img, (224, 224))
        current_emb = get_embedding(face_img, active_model_id)
        
        best_match = "Unknown"
        min_dist = 100.0
        threshold = 1.0

        for user_id, full_name, emb_str in db_users:
            saved_emb = np.array(list(map(float, emb_str.split(","))))
            dist = np.linalg.norm(current_emb - saved_emb)
            
            if dist < min_dist:
                min_dist = dist
                if dist < threshold:
                    best_match = full_name

        results.append({
            'bbox': [int(x), int(y), int(w), int(h)],
            'prediction': best_match,
            'confidence': round(max(0, (1 - min_dist/threshold) * 100), 2) if best_match != "Unknown" else 0,
            'distance': round(float(min_dist), 4)
        })

    return jsonify({'detections': results, 'method': 'vector_embedding'})

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    metrics_file = f'models/metrics_{active_model_id}.json'
    if not os.path.exists(metrics_file):
        metrics_file = 'models/metrics.json'
        
    if os.path.exists(metrics_file):
        try:
            import json
            with open(metrics_file, 'r') as f:
                data = json.load(f)
                data['model_id'] = active_model_id
                return jsonify(data)
        except:
            pass
    return jsonify({
        'accuracy': 0, 'loss': 0, 'folds': [], 'history': {'accuracy': [], 'loss': []}
    })

def extract_frames(video_path, output_dir, max_frames=50):
    cap = cv2.VideoCapture(video_path)
    count = 0
    saved_count = 0
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, total_frames // max_frames)

    while cap.isOpened() and saved_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        
        if count % step == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            for (x, y, w, h) in faces:
                face_img = frame[y:y+h, x:x+w]
                face_img = cv2.resize(face_img, (224, 224))
                
                img_name = os.path.join(output_dir, f"face_{saved_count:03d}.jpg")
                cv2.imwrite(img_name, face_img)
                saved_count += 1
                break

        count += 1
    
    cap.release()
    return saved_count

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = sqlite3.connect('faceid.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        for user in users:
            dataset_path = f"data/datasets/{user['user_id']}"
            if os.path.exists(dataset_path):
                user['image_count'] = len([f for f in os.listdir(dataset_path) if f.endswith('.jpg')])
            else:
                user['image_count'] = 0
                
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = sqlite3.connect('faceid.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
        
        raw_video = f"data/raw_videos/{user_id}.webm"
        dataset_dir = f"data/datasets/{user_id}"
        
        if os.path.exists(raw_video):
            os.remove(raw_video)
        if os.path.exists(dataset_dir):
            shutil.rmtree(dataset_dir)
            
        return jsonify({'success': True, 'message': f'Deleted user {user_id}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enroll', methods=['POST'])
def enroll_user():
    if 'video' not in request.files:
        return jsonify({'error': 'No video provided'}), 400
    
    video_file = request.files['video']
    user_id = request.form.get('userId')
    full_name = request.form.get('fullName')

    if not user_id or not full_name:
        return jsonify({'error': 'Missing user information'}), 400

    raw_video_dir = 'data/raw_videos'
    os.makedirs(raw_video_dir, exist_ok=True)
    video_path = os.path.join(raw_video_dir, f"{user_id}.webm")
    video_file.save(video_path)

    user_dataset_dir = f'data/datasets/{user_id}'
    os.makedirs(user_dataset_dir, exist_ok=True)

    try:
        conn = sqlite3.connect('faceid.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO users (user_id, full_name, video_path, created_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, full_name, video_path, datetime.now()))
        conn.commit()
        conn.close()
        
        try:
            frames_saved = extract_frames(video_path, user_dataset_dir)
            embeddings = []
            for img_name in os.listdir(user_dataset_dir):
                if img_name.endswith('.jpg'):
                    img_path = os.path.join(user_dataset_dir, img_name)
                    img_cv = cv2.imread(img_path)
                    emb = get_embedding(img_cv, active_model_id)
                    if emb is not None:
                        embeddings.append(emb)
            
            if embeddings:
                avg_embedding = np.mean(embeddings, axis=0)
                emb_str = ",".join(map(str, avg_embedding.tolist()))
                
                conn = sqlite3.connect('faceid.db')
                cursor = conn.cursor()
                cursor.execute('UPDATE users SET embedding = ? WHERE user_id = ?', (emb_str, user_id))
                conn.commit()
                conn.close()

        except Exception as e:
            frames_saved = 0

        return jsonify({
            'success': True, 
            'message': f'Successfully enrolled {full_name}',
            'video_path': video_path,
            'frames_extracted': frames_saved
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
