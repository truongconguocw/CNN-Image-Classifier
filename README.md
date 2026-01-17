Yeu cau may tinh cai dat:
*   **Python 3.10+**: [Tải tại đây](https://www.python.org/downloads/)
*   **Node.js (LTS)**: [Tải tại đây](https://nodejs.org/)
*   **Git**: [Tải tại đây](https://git-scm.com/)
### 2. Thiết lập Backend (Python Flask)
Trong thư mục gốc của dự án:
```bash
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo (Windows)
.\venv\Scripts\activate

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt
```

### 3. Thiết lập Frontend (React Vite)
Chuyển vào thư mục `app`:
```bash
cd app
npm install
```

---

## Chạy ứng dụng

Bạn cần mở **2 cửa sổ Terminal** song song:

### Terminal 1: Chạy Backend Server
Dùng để xử lý các thuật toán AI và API.
```bash
# Đảm bảo đang ở thư mục gốc và venv đã được kích hoạt
python server.py
```
*Server sẽ chạy tại: `http://localhost:5000`*

### Terminal 2: Chạy Frontend (Giao diện)
Dùng để hiển thị website.
```bash
cd app
npm run dev
```
*Truy cập website tại: `http://localhost:5173`*

---

## Cấu trúc dự án

*   `server.py`: Máy chủ Flask xử lý logic AI.
*   `app/`: Mã nguồn giao diện React + TailwindCSS.
*   `models/`: Nơi lưu trữ các file model `.h5` và `metrics.json`.
*   `notebooks/`: Các file Jupyter Notebook dùng để huấn luyện model.
*   `data/raw/`: Dữ liệu hình ảnh dùng để training.

