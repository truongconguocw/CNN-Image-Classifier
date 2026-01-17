import cv2
import os
import time

# --- CẤU HÌNH ---
NAME = "NguyenVanA"   # <--- SỬA TÊN NGƯỜI CẦN CHỤP Ở ĐÂY
SAVE_PATH = f"data/raw/{NAME}"
MAX_IMAGES = 100       # Số lượng ảnh cần chụp cho mỗi người (Càng nhiều càng tốt)

# Tạo thư mục nếu chưa có
if not os.path.exists(SAVE_PATH):
    os.makedirs(SAVE_PATH)

# Tải bộ phát hiện khuôn mặt mặc định của OpenCV (Haar Cascade)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

cap = cv2.VideoCapture(0) # Mở webcam (số 0 hoặc 1)

print(f"Bắt đầu thu thập dữ liệu cho: {NAME}")
print("Nhấn phím 's' để chụp ảnh, nhấn 'q' để thoát.")

count = 0
while count < MAX_IMAGES:
    ret, frame = cap.read()
    if not ret: break
    
    # Chuyển sang ảnh xám để phát hiện mặt dễ hơn
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Phát hiện khuôn mặt
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    for (x, y, w, h) in faces:
        # Vẽ khung hình chữ nhật quanh mặt (để bạn biết máy đã nhận)
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Cắt riêng phần khuôn mặt ra (ROI - Region of Interest)
        # VGG16 chỉ cần học cái mặt, không cần học cái áo hay bức tường sau lưng
        face_roi = frame[y:y+h, x:x+w]
        
        # Resize về kích thước nhỏ vừa phải (ví dụ 224x224 luôn cũng được)
        face_roi = cv2.resize(face_roi, (224, 224))
        
        # Hiển thị số lượng đã chụp trên màn hình
        cv2.putText(frame, f"Da chup: {count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    cv2.imshow('Thu thap du lieu (Nhan S de luu)', frame)
    
    key = cv2.waitKey(1)
    if key == ord('s'): # Nhấn 's' để lưu ảnh hiện tại
        if len(faces) > 0: # Chỉ lưu khi tìm thấy mặt
            filename = os.path.join(SAVE_PATH, f"{NAME}_{count}.jpg")
            cv2.imwrite(filename, face_roi)
            print(f"Đã lưu: {filename}")
            count += 1
            time.sleep(0.1) # Dừng một chút để không chụp trùng quá nhanh
        else:
            print("Không tìm thấy khuôn mặt nào để lưu!")

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Hoàn tất thu thập!")