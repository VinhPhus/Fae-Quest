# FaeQuest — Hệ Thống Quản Lý Nhiệm Vụ Nhập Vai (Gamified RPG Todo App)

> **Phiên bản:** 2.0 (Modern React + TypeScript + Tailwind CSS + Zustand)  
> **Ngôn ngữ giao diện:** Tiếng Việt  
> **Cảm hứng thiết kế:** Dark Fantasy RPG Palette For Illustration #7 (Thorn Crown, Blood Bargain, Opal, Fae Fruit)

---

## 🌟 1. Tính Năng Đã Triển Khai (Theo Đặc Tả SRS)

### 🗡️ Phân hệ Quản Lý Nhiệm Vụ (Daily Quests)
- **5 Phân loại nhiệm vụ:** 📚 Học tập, 💼 Công việc, 💪 Thể lực, ❤️ Cá nhân, 🎨 Sáng tạo.
- **4 Mức độ khó & Quy đổi điểm:**
  - **Khởi Động (Dễ):** `+30 EXP`, `+2 Xu`
  - **Tiêu Chuẩn (Vừa):** `+60 EXP`, `+5 Xu`
  - **Thử Thách (Khó):** `+110 EXP`, `+10 Xu`
  - **Trùm Cuối Ngày (Boss):** `+200 EXP`, `+20 Xu`
- **Hiệu ứng chữ nổi bay (+EXP / +Xu):** Bay lên tại vị trí nhấn chuột kèm âm thanh RPG chân thực.
- **Lọc thông minh:** Lọc theo phân loại và trạng thái (*Tất cả*, *Chưa xong*, *Đã xong*).

### 👑 Động Cơ Thăng Hạng 7 Bậc Rank (7-Tier Rank Engine)
1. **Đồng** (`0 - 199 EXP`) — Thưởng: `0 Xu`
2. **Bạc** (`200 - 499 EXP`) — Thưởng: `+50 Xu`
3. **Vàng** (`500 - 999 EXP`) — Thưởng: `+100 Xu`
4. **Lục Bảo** (`1000 - 1799 EXP`) — Thưởng: `+160 Xu`
5. **Cao Thủ** (`1800 - 2799 EXP`) — Thưởng: `+250 Xu`
6. **Đại Cao Thủ** (`2800 - 3999 EXP`) — Thưởng: `+400 Xu`
7. **Thách Đấu** (`4000+ EXP`) — Thưởng: `+700 Xu`
- **Hiệu ứng Thăng Cấp (Rank Up):** Modal chúc mừng, biểu tượng SVG huy hiệu riêng biệt cho từng Rank, pháo hoa rực rỡ (`canvas-confetti`) và tự động cộng Xu thưởng vào tài khoản.
- **Thanh lộ trình 7 Bậc:** Tương tác trực quan, bấm vào để xem bảng chi tiết toàn bộ các bậc Rank.

### 🛍️ Cửa Hàng Tự Thưởng & Kho Vé (Reward Shop & Inventory)
- Đổi Xu tích lũy để nhận các phần thưởng tự thưởng bản thân ngoài đời thực.
- **Tự tạo phần thưởng cá nhân:** Tùy biến Tên, Mô tả, Emoji và Giá Xu.
- **Kho Vé Thưởng:** Vé sau khi mua được lưu trữ tại tab Kho Đồ, bấm **"Sử dụng ngay"** khi thực hiện ngoài đời.

### ⚔️ Bảng Xếp Hạng Đối Thủ Giả Lập (Simulated Rivals)
- 7 đối thủ trải đều từ Đồng đến Thách Đấu.
- **Banner Mục Tiêu Bứt Phá:** Tự động tính số EXP cần thêm để vượt qua đối thủ trực tiếp phía trước.
- **Cập nhật hoạt động:** Mô phỏng các đối thủ gia tăng EXP mỗi ngày để tạo áp lực thi đua.
- **Thêm đối thủ mới:** Cho phép thêm bạn bè hoặc mục tiêu cạnh tranh riêng.

### 🚀 Nâng Cấp Nâng Cao (Phase 2 Features)
- **Chuỗi Kỷ Luật (Daily Streak):** Thưởng `+20% Combo EXP` khi duy trì chuỗi từ 3 ngày trở lên.
- **Đồng Hồ Fae Focus (Pomodoro Timer):** Đếm ngược 25 phút tập trung sâu, thưởng thêm `+25 EXP & +10 Xu` khi hoàn thành phiên.
- **Thống Kê Năng Suất (Analytics):** Biểu đồ phân bổ tỷ lệ hoàn thành theo 5 nhóm nhiệm vụ.
- **Nhiệm Vụ Lặp Lại (Daily Reset):** Tự động đặt lại trạng thái nhiệm vụ định kỳ khi sang ngày mới.
- **Âm thanh Web Audio API:** Tạo trực tiếp bằng bộ tổng hợp âm thanh Synth (không phụ thuộc file âm thanh ngoài).

---

## 🛠️ 2. Hướng Dẫn Cài Đặt & Khởi Chạy (Build & Run Guide)

Dự án đã được cài đặt đầy đủ dependencies và cấu hình sẵn sàng.

### Bước 1: Mở Terminal tại thư mục dự án
```powershell
cd C:\RPG_Todo
```

### Bước 2: Chạy ở chế độ Phát triển (Dev Server)
```powershell
npm run dev
```
- Ứng dụng sẽ khởi chạy tại: `http://localhost:3000` (hoặc cổng hiển thị trên terminal).
- Trình duyệt sẽ tự động mở trang web.

### Bước 3: Đóng gói ứng dụng cho Production (Build)
```powershell
npm run build
```
- Lệnh này sẽ biên dịch TypeScript và tối ưu hóa tài nguyên qua Vite.
- Thư mục đầu ra là `dist/` (chứa HTML, CSS, JS đã được nén và tối ưu).

### Bước 4: Xem trước bản Build (Preview)
```powershell
npm run preview
```
- Cho phép kiểm tra trực tiếp sản phẩm sau khi build.

---

## 📁 3. Cấu Trúc Mã Nguồn

```text
C:\RPG_Todo/
├── dist/                      # Thư mục sản phẩm sau khi build
├── src/
│   ├── components/
│   │   ├── analytics/         # Thống kê năng suất cá nhân
│   │   ├── hero/              # Hero card, huy hiệu SVG, dải tiến trình 7 bậc
│   │   ├── layout/            # Header nghệ thuật, thanh chuyển tab
│   │   ├── leaderboard/       # Bảng xếp hạng, banner đối thủ, modal thêm đối thủ
│   │   ├── modals/            # Rank Up ăn mừng, lộ trình Rank, đổi tên, reset
│   │   ├── quests/            # Form thêm task, bộ lọc, danh sách task, Pomodoro
│   │   ├── shop/              # Lưới shop, modal thêm vật phẩm, kho vé thưởng
│   │   └── ui/                # Toast thông báo, hiệu ứng EXP nổi
│   ├── constants/             # Ranks, Categories, Initial Data
│   ├── store/                 # Zustand store (lưu trữ localStorage)
│   ├── types/                 # TypeScript interfaces
│   ├── utils/                 # Web Audio API Synthesizer
│   ├── App.tsx                # Giao diện chính điều phối các module
│   ├── index.css              # Custom styling, dark fantasy gradients, keyframes
│   └── main.tsx               # Điểm nhập React
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```
