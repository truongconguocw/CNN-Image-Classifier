import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from .config import MODELS_CONFIG, MODELS_DIR, DATA_DIR, METRICS_DEFAULT
from .database import init_db, get_all_users
from .services.recognition_service import predict_cnn, predict_vector
from .services.user_service import enroll_new_user, delete_user_files
from .services.model_service import load_model_instance
from .utils.image_utils import face_cascade, detect_head_pose
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

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
