# CNN Face Recognition System (Nhom 1 AI)

Hệ thống nhận diện khuôn mặt thời gian thực sử dụng mạng Neural tích chập (CNN) và Feature Vector Matching. Dự án được tối ưu hóa cho hiệu suất cao, giao diện hiện đại và khả năng quản lý model linh hoạt.

## 🌟 Tính năng chính

- **Dự đoán CNN (Classification)**: Nhận diện trực tiếp dựa trên các model `.h5` đã huấn luyện (Custom CNN, VGG16, v.v.).
- **Vector Matching**: So khớp đặc trưng khuôn mặt (Embedding) để nhận diện người dùng mới mà không cần train lại model.
- **Quản lý Model linh hoạt**: Chọn nhanh các phiên bản model (`fold_1`, `fold_2`, v.v.) trực tiếp từ giao diện.
- **Thu thập dữ liệu thông minh**: Trích xuất khuôn mặt từ video, tự động lọc ảnh mờ và ảnh trùng lặp.
- **Nhận diện đa hướng**: Sử dụng nhiều Cascades (Frontal, Profile) để không bỏ sót khuôn mặt ở mọi góc độ.

## 🏗️ Cấu trúc dự án

Dự án được chia thành 2 phần chính: **Backend (Flask)** và **Frontend (React)**.

```text
CNN-Image-Classifier/
├── app/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── layouts/        # Bố cục giao diện (Sidebar, Topbar)
│   │   └── pages/          # Các trang chức năng (Dashboard, Detection,...)
│   └── ...
├── backend/                # Backend (Flask API)
│   ├── services/           # Logic xử lý AI và dữ liệu chuyên sâu
│   ├── utils/              # Các công cụ hỗ trợ xử lý ảnh/video
│   └── database.py         # Quản lý cơ sở dữ liệu SQLite
├── data/                   # Dữ liệu hình ảnh (Raw & Processed)
├── models/                 # Thư mục chứa các tệp model .h5 và cấu hình
├── notebooks/              # Tài liệu hướng dẫn & mã nguồn huấn luyện model
├── faceid.db               # Cơ sở dữ liệu người dùng & đặc trưng khuôn mặt
├── video_to_faces.py       # Script trích xuất mặt từ Video
└── preprocess_data.py      # Script chuẩn hóa tập dữ liệu
```

## 📄 Chi tiết vai trò từng File

### Backend (Python/Flask)
- **`backend/app.py`**: Điểm khởi đầu của API, quản lý các route như nhận diện, chuyển đổi model, quản lý người dùng.
- **`backend/config.py`**: Chứa cấu hình hệ thống, đường dẫn thư mục và logic tải danh sách model từ ổ đĩa.
- **`backend/database.py`**: Khởi tạo và thực thi các câu lệnh SQL để lưu trữ thông tin người dùng và vector đặc trưng.
- **`backend/services/recognition_service.py`**: **Trái tim của AI**. Chứa logic nhận diện đa hướng, kỹ thuật cắt sát (Tight Cropping) và so khớp vector.
- **`backend/services/model_service.py`**: Quản lý việc nạp model vào bộ nhớ và các bước tiền xử lý ảnh (Rescale, VGG16 standard).
- **`backend/services/user_service.py`**: Xử lý logic đăng ký người dùng mới và quản lý tệp tin cá nhân.
- **`backend/utils/image_utils.py`**: Chứa các bộ dò khuôn mặt (Cascade) và thuật toán NMS (Non-Maximum Suppression) để làm sạch khung nhận diện.

### Frontend (React/Zustand)
- **`Dashboard.jsx`**: Giám sát hệ thống, thông số RAM và trạng thái vận hành.
- **`Imageclassification.jsx`**: Giao diện kiểm tra nhận diện trên file ảnh tĩnh.
- **`RealTimeRecognition.jsx`**: Nhận diện trực tiếp qua Webcam với tốc độ cao.
- **`Setfaceid.jsx`**: Trang quản lý thu thập dữ liệu và đăng ký khuôn mặt mới.
- **`MainLayout.jsx`**: Điều hướng toàn trang và menu chọn Model nhanh ở Header.

### Scripts & AI Notebooks
- **`video_to_faces.py`**: Tự động trích xuất các khung hình chất lượng cao nhất từ video để làm dữ liệu huấn luyện.
- **`preprocess_data.py`**: Chuẩn hóa kích thước ảnh về 224x224 và phân loại thư mục.
- **`notebooks/`**: Chứa các tệp Jupyter Notebook chi tiết quá trình xây dựng, huấn luyện và đánh giá model theo phương pháp K-Fold.

## 🚀 Hướng dẫn khởi chạy

### Backend
1. Cài đặt thư viện: `pip install -r requirements.txt`
2. Chạy Server: `python server.py` (Mặc định chạy tại port 5000)

### Frontend
1. Chạy tại thư mục `app`: `npm install && npm run dev`
2. Truy cập: `http://localhost:5173`

---
> [!NOTE]
> Dự án được phát triển bởi **Nhom 1 AI** với mục tiêu tạo ra một hệ thống nhận diện khuôn mặt mạnh mẽ, dễ sử dụng và có khả năng mở rộng tốt.
