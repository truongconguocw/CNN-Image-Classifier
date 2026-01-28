import numpy as np
import cv2
from .model_service import load_model_instance, preprocess_face, get_face_embedding
from ..database import get_class_names, get_db_connection
from ..utils.image_utils import apply_nms, face_cascade

def predict_cnn(img_cv, model_id):
    model = load_model_instance(model_id)
    if not model:
        return None, "Model not loaded"
    
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    class_names = get_class_names()
    
    try:
        output_size = model.output_shape[-1]
    except:
        try:
            output_size = model.layers[-1].output_shape[-1]
        except:
            output_size = len(class_names)
    
    is_mismatch = output_size != len(class_names)
    
    results = []
    
    def process_img(image, box=None):
        processed = preprocess_face(image, model_id)
        preds = model.predict(processed)
        class_idx = np.argmax(preds[0])
        confidence = float(preds[0][class_idx]) * 100
        
        if confidence > 70.0:
            if is_mismatch:
                label = f"Untrained_{class_idx}"
            else:
                label = class_names[class_idx]
            
            results.append({
                'bbox': box if box else [0, 0, image.shape[1], image.shape[0]],
                'prediction': label,
                'confidence': round(confidence, 2)
            })

    if len(faces) == 0:
        process_img(img_cv)
    else:
        for (x, y, w, h) in faces:
            face_img = img_cv[y:y+h, x:x+w]
            process_img(face_img, [int(x), int(y), int(w), int(h)])
    
    return apply_nms(results), None

def predict_vector(img_cv, model_id):
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    if len(faces) == 0:
        return [], None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT full_name, embedding FROM users WHERE embedding IS NOT NULL')
    db_users = cursor.fetchall()
    conn.close()

    results = []
    for (x, y, w, h) in faces:
        face_img = img_cv[y:y+h, x:x+w]
        face_resized = cv2.resize(face_img, (224, 224))
        current_emb = get_face_embedding(face_resized, model_id)
        
        best_match = "Unknown"
        min_dist = 100.0
        threshold = 1.0

        if current_emb is not None:
            for full_name, emb_str in db_users:
                saved_emb = np.array(list(map(float, emb_str.split(","))))
                dist = np.linalg.norm(current_emb - saved_emb)
                if dist < min_dist:
                    min_dist = dist
                    if dist < threshold:
                        best_match = full_name

        confidence = round(max(0, (1 - min_dist/threshold) * 100), 2) if best_match != "Unknown" else 0
        results.append({
            'bbox': [int(x), int(y), int(w), int(h)],
            'prediction': best_match,
            'confidence': confidence,
            'distance': round(float(min_dist), 4)
        })
    return results, None
