import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import cv2

app = Flask(__name__)
CORS(app)
MODELS_CONFIG = {
    'vgg16': {
        'path': 'models/vgg16_best_fold_5.h5',
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
            print(f"DEBUG: Model đoán ra Index: {class_idx} (Tên: {CLASS_NAMES[class_idx]})")
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
                print(f"DEBUG: Model đoán ra Index: {class_idx} (Tên: {CLASS_NAMES[class_idx]})")
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
        print(f"Lỗi server: {e}")
        return jsonify({'error': str(e)}), 500
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
