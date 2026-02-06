import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from .config import MODELS_CONFIG, MODELS_DIR, DATA_DIR, METRICS_DEFAULT
from .database import init_db, get_all_users
from .services.recognition_service import predict_cnn, predict_vector
from .services.user_service import enroll_new_user, delete_user_files
from .services.model_service import load_model_instance, loaded_models
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

active_model_id = 'vgg16'

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory(DATA_DIR, filename)

@app.route('/api/models', methods=['GET'])
def get_models():
    # Scan models directory for all .h5 files
    files = [f for f in os.listdir(MODELS_DIR) if f.endswith('.h5')]
    
    available_models = []
    # Mix known configs and existing files
    for filename in files:
        model_id = filename.replace('.h5', '').lower()
        # User requested to show .h5 files directly
        name = filename
        preprocess = 'rescale'
        
        if model_id in MODELS_CONFIG:
            preprocess = MODELS_CONFIG[model_id]['preprocess']
        elif 'vgg16' in filename.lower():
            preprocess = 'vgg16'
            
        available_models.append({
            'id': filename,
            'name': name,
            'filename': filename,
            'preprocess': preprocess,
            'exists': True
        })
        
    # Try to find filename of active model for UI matching
    active_display = active_model_id
    if active_model_id in MODELS_CONFIG:
        active_display = os.path.basename(MODELS_CONFIG[active_model_id]['path'])

    return jsonify({
        'active_model': active_display,
        'available_models': available_models
    })

@app.route('/api/list-model-files', methods=['GET'])
def list_model_files():
    files = [f for f in os.listdir(MODELS_DIR) if f.endswith('.h5')]
    return jsonify({'files': files})

@app.route('/api/select_model', methods=['POST'])
def select_model():
    global active_model_id
    data = request.json
    model_id = data.get('model_id') # This can be an ID or a filename
    
    # CASE 1: Selecting by Filename (New requirement)
    if model_id.endswith('.h5'):
        filename = model_id
        path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(path):
            return jsonify({'error': 'Model file not found'}), 404
            
        # Register it on the fly if not in config
        clean_id = filename.replace('.h5', '').lower()
        if clean_id not in MODELS_CONFIG:
            MODELS_CONFIG[clean_id] = {
                'path': path,
                'name': filename,
                'preprocess': 'vgg16' if 'vgg16' in filename.lower() else 'rescale'
            }
        model_id = clean_id

    # CASE 2: Standard selection
    if model_id not in MODELS_CONFIG:
        return jsonify({'error': 'Invalid model ID'}), 400
    if not os.path.exists(MODELS_CONFIG[model_id]['path']):
        return jsonify({'error': 'Model file not found'}), 404
        
    if load_model_instance(model_id):
        active_model_id = model_id
        return jsonify({'success': True, 'active_model': active_model_id})
    return jsonify({'error': 'Failed to load model'}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    nparr = np.frombuffer(file.read(), np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    detections, error = predict_cnn(img_cv, active_model_id)
    if error:
        return jsonify({'error': error}), 500
    return jsonify({'detections': detections, 'model_used': active_model_id})

@app.route('/api/predict-vector', methods=['POST'])
def predict_vector_route():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    nparr = np.frombuffer(file.read(), np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    results, error = predict_vector(img_cv, active_model_id)
    if error:
        return jsonify({'error': error}), 500
    return jsonify({'detections': results, 'method': 'vector_embedding'})

@app.route('/api/enroll', methods=['POST'])
def enroll():
    if 'video' not in request.files:
        return jsonify({'error': 'No video provided'}), 400
    video_file = request.files['video']
    user_id = request.form.get('userId')
    full_name = request.form.get('fullName')
    if not user_id or not full_name:
        return jsonify({'error': 'Missing user information'}), 400
    success, frames, path = enroll_new_user(user_id, full_name, video_file, active_model_id)
    if success:
        return jsonify({'success': True, 'message': f'Successfully enrolled {full_name}', 'frames_extracted': frames})
    return jsonify({'error': path}), 500

@app.route('/api/users', methods=['GET'])
def get_users_list():
    users = get_all_users()
    for user in users:
        count = 0
        for d in ['datasets', 'processed']:
            folder_name = user['user_id'] if d == 'datasets' else user['full_name']
            p = os.path.join(DATA_DIR, d, folder_name)
            if os.path.exists(p):
                count += len([f for f in os.listdir(p) if f.endswith('.jpg')])
        user['image_count'] = count
    return jsonify(users)

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    if delete_user_files(user_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete'}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    metrics_file = os.path.join(MODELS_DIR, f'metrics_{active_model_id}.json')
    if not os.path.exists(metrics_file):
        metrics_file = os.path.join(MODELS_DIR, 'metrics.json')
    if os.path.exists(metrics_file):
        try:
            with open(metrics_file, 'r') as f:
                data = json.load(f)
                data['model_id'] = active_model_id
                return jsonify(data)
        except:
            pass
    return jsonify({'accuracy': 0, 'loss': 0, 'folds': [], 'history': {'accuracy': [], 'loss': []}})

@app.route('/api/validate-face', methods=['POST'])
def validate_face():
    if 'file' not in request.files:
        return jsonify({'valid': False}), 400
    nparr = np.frombuffer(request.files['file'].read(), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    return jsonify({'valid': len(faces) > 0})

@app.route('/api/detect-pose', methods=['POST'])
def detect_pose_route():
    if 'file' not in request.files:
        return jsonify({'pose': 'unknown'}), 400
    nparr = np.frombuffer(request.files['file'].read(), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return jsonify({'pose': detect_head_pose(img)})

@app.after_request
def log_response(response):
    if response.content_type == 'application/json':
        try:
            data = json.loads(response.get_data().decode('utf-8'))
            print(f"\n[DEBUG] {request.method} {request.path} -> {response.status_code}")
            print(f"Response Body: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"\n[DEBUG] Could not log response: {e}")
    else:
        print(f"\n[DEBUG] {request.method} {request.path} -> {response.status_code} ({response.content_type})")
    return response

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
