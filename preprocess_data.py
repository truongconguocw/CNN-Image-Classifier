import cv2
import os
from pathlib import Path
INPUT_DIR = 'data/raw'        
OUTPUT_DIR = 'data/processed'
IMG_SIZE = (224, 224)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def process_dataset():
    for subdir in os.listdir(INPUT_DIR):
        input_path = os.path.join(INPUT_DIR, subdir)
        output_path = os.path.join(OUTPUT_DIR, subdir)
        
        if not os.path.isdir(input_path): continue
        if not os.path.exists(output_path):
            os.makedirs(output_path)
            
        print(f"Đang xử lý thư mục: {subdir}...")
        
        count = 0
        for filename in os.listdir(input_path):
            try:
                img_path = os.path.join(input_path, filename)
                img = cv2.imread(img_path)
                if img is None: continue
                
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) > 0:
                    faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
                    (x, y, w, h) = faces[0]
                    crop_x = x + int(w * 0.1)
                    crop_y = y + int(h * 0.1)
                    crop_w = int(w * 0.8)
                    crop_h = int(h * 0.8)
                    face_roi = img[crop_y:crop_y+crop_h, crop_x:crop_x+crop_w]
                    face_roi = cv2.resize(face_roi, IMG_SIZE)
                    save_path = os.path.join(output_path, filename)
                    cv2.imwrite(save_path, face_roi)
                    count += 1
            except Exception as e:
                print(f"Lỗi ảnh {filename}: {e}")
                
        print(f"-> Đã lọc sạch {count} ảnh của {subdir}")

if __name__ == "__main__":
    process_dataset()
    print("\nXong")