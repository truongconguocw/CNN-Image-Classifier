import cv2
import os

# --- CẤU HÌNH ---
VIDEO_PATH = "ronaldo_video.mp4"   # Tên file video bạn đã tải về (để cùng thư mục với code này)
OUTPUT_FOLDER = "data/raw/Ronaldo " # Thư mục muốn lưu ảnh
FRAME_SKIP = 120  # Cứ 10 khung hình thì lấy 1 ảnh (để ảnh không bị trùng lặp quá nhiều)

# Tạo thư mục nếu chưa có
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# Load bộ phát hiện khuôn mặt
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Mở video
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print(f"❌ Lỗi: Không mở được file video '{VIDEO_PATH}'. Kiểm tra lại tên file!")
    exit()

count = 0
saved_count = 0

print(f"--- BẮT ĐẦU XỬ LÝ VIDEO: {VIDEO_PATH} ---")

while True:
    ret, frame = cap.read()
    if not ret: break # Hết video thì dừng

    # Chỉ xử lý mỗi N khung hình (để tránh lấy quá nhiều ảnh giống hệt nhau)
    if count % FRAME_SKIP == 0:
        # Chuyển sang ảnh xám để tìm mặt nhanh hơn
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Phát hiện khuôn mặt
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        for (x, y, w, h) in faces:
            # Cắt riêng phần mặt
            face_roi = frame[y:y+h, x:x+w]
            
            try:
                # Resize về chuẩn 224x224 cho VGG16
                face_roi = cv2.resize(face_roi, (224, 224))
                
                # Tạo tên file không trùng
                file_name = os.path.join(OUTPUT_FOLDER, f"ronaldothuhai_{saved_count}.jpg")
                
                # Lưu ảnh
                cv2.imwrite(file_name, face_roi)
                print(f"✅ Đã lưu: {file_name}")
                saved_count += 1
            except Exception as e:
                pass # Bỏ qua nếu ảnh lỗi

    count += 1

cap.release()
print("="*30)
print(f"🎉 HOÀN TẤT! Đã trích xuất được {saved_count} khuôn mặt.")
print(f"Kiểm tra thư mục: {OUTPUT_FOLDER}")