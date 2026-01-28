import cv2
import os
import numpy as np

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
    profiles_flipped = profile_cascade.detectMultiScale(flipped_gray, 1.1, 4)
    if len(profiles_flipped) > 0:
        return "left"
    return "unknown"

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

def extract_frames(video_path, output_dir, max_frames=100):
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
            detected_face = None
            if len(faces) > 0:
                detected_face = faces[0]
            else:
                profiles = profile_cascade.detectMultiScale(gray, 1.1, 4)
                if len(profiles) > 0:
                    detected_face = profiles[0]
                else:
                    flipped_gray = cv2.flip(gray, 1)
                    profiles_flipped = profile_cascade.detectMultiScale(flipped_gray, 1.1, 4)
                    if len(profiles_flipped) > 0:
                        detected_face = profiles_flipped[0]
                        fx, fy, fw, fh = detected_face
                        detected_face = [frame.shape[1] - fx - fw, fy, fw, fh]
            if detected_face is not None:
                x, y, w, h = detected_face
                face_img = frame[y:y+h, x:x+w]
                if face_img.size > 0:
                    face_img = cv2.resize(face_img, (224, 224))
                    img_name = os.path.join(output_dir, f"face_{saved_count:03d}.jpg")
                    cv2.imwrite(img_name, face_img)
                    saved_count += 1
        count += 1
    cap.release()
    return saved_count
