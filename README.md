<div align="center">

# ⚔️ FAEQUEST — RPG PRODUCTIVITY PLATFORM ⚔️
### *Hệ Thống Quản Lý Nhiệm Vụ & Rèn Luyện Năng Suất Nhập Vai Dark Fantasy*

[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-FF5722?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

**[Trải nghiệm Trực tiếp (Live Demo)](https://faequest.vercel.app)** • **[Tài liệu Đặc tả SRS](file:///c:/RPG_Todo/SRS_TrienKhai.md)** • **[Báo cáo Sự cố](https://github.com/VinhPhus/Fae-Quest/issues)**

</div>

---

## 📖 GIỚI THIỆU TỔNG QUAN

**FaeQuest** là nền tảng quản lý công việc và rèn luyện năng suất hằng ngày (Personal Task & Productivity Management) được kiến trúc dựa trên triết lý **Gamification (Trò chơi hóa)** chuyên sâu mang phong cách **Dark Fantasy RPG**.

FaeQuest biến những danh sách công việc tẻ nhạt thành hành trình tôi luyện ý chí của một **Thợ Săn Fae**:
- 🎯 **Tích lũy EXP & Xu Vàng:** Hoàn thành nhiệm vụ thực tế ngoài đời để tích lũy điểm kinh nghiệm, nhận Xu thưởng khi thăng cấp và chuỗi ngày.
- 👑 **Chinh phục 7 Bậc Rank:** Tiến hóa từ *Tân Binh Đồng* lên *Thần Thoại Thách Đấu* với các huy hiệu độc quyền và phần thưởng danh giá.
- 🛍️ **Cửa Hàng Tự Thưởng (Reward Shop):** Dùng Xu kiếm được để mở khóa những phần thưởng ngoài đời thực, tạo vòng lặp động lực nội tại bền vững.
- 🕸️ **Sơ Đồ Lục Giác Năng Lực (6-Axis Radar):** Đo lường và duy trì cân bằng giữa 6 trụ cột cuộc sống (*Trí Tuệ, Sự Nghiệp, Thể Chất, Tự Chủ, Sáng Tạo, Kỷ Luật*).
- ⏱️ **Fae Focus (Pomodoro Deep Work):** Đắm chìm vào các phiên làm việc sâu cùng máy phát âm thanh môi trường thư giãn (*Mưa rơi, Lửa trại, Gió rừng, Sóng Cyber*).
- ⚔️ **Đấu Trường & Leaderboard:** Cạnh tranh thứ hạng công bằng trên Bảng Xếp Hạng Cộng Đồng và so kèo lục giác trực quan với người chơi khác.
- 📸 **Xuất Thẻ Chiến Tích 9:16 (Hunter Battle Card):** Tạo thẻ sưu tầm chuẩn độ phân giải cao 1080x1920 để chia sẻ lên Story mạng xã hội (TikTok, Instagram, Facebook).

---

## ✨ TÍNH NĂNG NỔI BẬT (KEY HIGHLIGHTS)

### 1. 📋 Bảng Lệnh Nhiệm Vụ Thông Minh (Quest Board Engine)
- **5 Nhóm Hoạt Động Cốt Lõi:** 📚 *Học tập* (`hoc-tap`), 💼 *Công việc* (`cong-viec`), 💪 *Thể lực* (`the-luc`), ❤️ *Cá nhân* (`ca-nhan`), 🎨 *Sáng tạo* (`sang-tao`).
- **4 Cấp Độ Thử Thách:**
  - 🌱 **Khởi Động (Dễ):** `+30 EXP` • `+2 Xu` (Hoạt động ngắn dưới 15 phút).
  - ⚔️ **Tiêu Chuẩn (Vừa):** `+60 EXP` • `+5 Xu` (Thời lượng 30 – 60 phút).
  - 🔥 **Thử Thách (Khó):** `+110 EXP` • `+10 Xu` (Đòi hỏi sự tập trung cao).
  - 👑 **Trùm Cuối Ngày (Boss):** `+200 EXP` • `+20 Xu` (Thử thách lớn nhất trong ngày).
- **Lập lịch Ngày Mai (`target_date`):** Phân tách tab *Hôm nay* / *Ngày mai*. Cơ chế khóa an toàn ngăn chặn nghiệm thu trước hạn.
- **Nhiệm vụ lặp lại hằng ngày (Daily Recurring):** Tự động đặt lại trạng thái vào 00:00 hằng ngày theo múi giờ địa phương `Asia/Ho_Chi_Minh`.
- **Ngưỡng Giới Hạn Thể Lực (Anti-Grind Cap):** Giới hạn tối đa **20 nhiệm vụ nhận thưởng/ngày** để bảo vệ sức khỏe và khuyến khích kỷ luật bền vững.
- **Khóa Chống Gian Lận (Anti-Cheat & Concurrency Lock):** Tự động phát hiện thao tác nhanh liên tục để bảo vệ tính công bằng trên BXH.

---

### 2. 🕸️ Sơ Đồ Lục Giác Năng Lực 6 Trụ Cột & Phân Bổ 3 Tầng
- **Thang điểm 1.0 – 5.0 tăng tiến mượt theo mốc EXP:**
  - $0 \text{ EXP} \rightarrow 1.0 \quad|\quad 100 \text{ EXP} \rightarrow 2.0 \quad|\quad 300 \text{ EXP} \rightarrow 3.0 \quad|\quad 600 \text{ EXP} \rightarrow 4.0 \quad|\quad \ge 1000 \text{ EXP} \rightarrow 5.0$
- **Bảo toàn dữ liệu lịch sử vĩnh viễn:** Điểm năng lực tính từ tổng EXP và số task hoàn thành từ trước tới nay (`cumulativeCategoryStats`), **không bao giờ bị tụt về `0/0` khi người dùng dọn dẹp task cũ**.
- **Khung Phân Tích Thiên Hướng Thợ Săn:**
  - Tự động nhận diện **7 Hệ Thợ Săn**: *Học Giả Hắc Ám*, *Chiến Binh Thép*, *Chiến Lược Gia*, *Hành Giả Tĩnh Tâm*, *Nghệ Sĩ Hư Không*, *Bậc Thầy Thiết Luật*, hoặc *Thợ Săn Toàn Diện*.
  - Cung cấp 2 thẻ gợi ý: **Điểm Mạnh Nhất** (phát huy) và **Cần Bồi Đắp** (bổ sung nhiệm vụ).
- **Bảng Phân Bổ 3 Tầng Dữ Liệu:**
  - **Tầng 1:** Tiến độ 5 nhóm hoạt động với dải màu gradient riêng.
  - **Tầng 2:** Phân bổ theo 4 độ khó bằng **Stacked Progress Bar** kèm 4 ô thống kê Dễ, Vừa, Khó, Trùm.
  - **Tầng 3:** Biểu đồ phong độ 7 ngày qua (Hôm nay màu vàng hoàng kim, ngày có hoạt động màu ngọc lam, ngày nghỉ màu tối mờ).

---

### 3. ⏱️ Fae Focus — Pomodoro Deep Work & Ambient Sounds
- **Tập trung sâu theo từng nhiệm vụ:** Thiết lập phiên đếm ngược từ 15 đến 120 phút.
- **Bộ máy Âm thanh Thư giãn Nền (Ambient Synth):** Tự động tạo âm thanh trực tiếp qua Web Audio API: *Tiếng mưa rơi (Rain)*, *Tiếng lửa trại (Campfire)*, *Tiếng gió rừng (Nature)*, *Sóng âm viễn tưởng (Cyberpunk)*.
- **Media Session API & Notifications:** Đồng bộ thời gian đếm ngược lên màn hình khóa điện thoại và gửi thông báo khi hoàn thành.
- **Thưởng kinh nghiệm & Xu:** Cộng thưởng dựa trên thời gian tập trung thực tế.

---

### 4. 👑 Hệ Thống 7 Bậc Rank & Chuỗi Ngày Kỷ Luật (Streak)
| STT | Bậc Rank | Ngưỡng EXP | Thưởng Xu Thăng Hạng | Danh Hiệu Khởi Đầu |
| :-: | :--- | :---: | :---: | :--- |
| **1** | **Đồng** (`dong`) | `0 – 199` | Mặc định | Tân Binh Gai Đỏ |
| **2** | **Bạc** (`bac`) | `200 – 499` | `+50 Xu` | Kiếm Sĩ Tập Sự |
| **3** | **Vàng** (`vang`) | `500 – 999` | `+100 Xu` | Chiến Binh Ánh Kim |
| **4** | **Lục Bảo** (`luc-bao`) | `1000 – 1799` | `+160 Xu` | Thợ Săn Lục Bảo |
| **5** | **Cao Thủ** (`cao-thu`) | `1800 – 2799` | `+250 Xu` | Bậc Thầy Thời Gian |
| **6** | **Đại Cao Thủ** (`dai-cao-thu`) | `2800 – 3999` | `+400 Xu` | Huyền Thoại Hắc Ám |
| **7** | **Thách Đấu** (`thach-dau`) | `4000+` | `+700 Xu` | Thần Thoại Tối Cao |

- **Thưởng Chuỗi (Streak Bonus):** Duy trì chuỗi $\ge 3$ ngày liên tiếp được thưởng thêm **+20% EXP** cho tất cả nhiệm vụ hoàn thành.
- **Sự kiện Thăng Hạng (Rank Up Celebration):** Pháo hoa rực rỡ (`canvas-confetti`), hiệu ứng âm thanh kèn thắng trận và modal vinh danh.

---

### 5. 🛍️ Cửa Hàng Tự Thưởng & Kho Vé (Reward Shop & Inventory)
- **Tự thiết lập phần thưởng:** Đổi Xu lấy những món quà mơ ước ngoài đời thực. Cho phép tự tạo phần thưởng mới với Tên, Mô tả, Emoji và Giá Xu.
- **Đồng bộ hóa đám mây tức thì:** Thêm hoặc xóa vật phẩm được lưu và đồng bộ ngay lên Supabase (`user_states.state_json`).
- **Kho Vé Thưởng:** Quản lý danh sách vé chưa sử dụng và vé đã đổi, bấm "Sử dụng ngay" khi thực hiện ngoài đời.

---

### 6. ⚔️ Đấu Trường & Bảng Xếp Hạng Cộng Đồng
- **Top 50 Thợ Săn toàn server:** Lấy dữ liệu trực tiếp từ Supabase `profiles` (loại trừ tài khoản admin).
- **Modal Hồ Sơ Mini (`RivalProfileModal`) Chống Tràn ở Mọi Mức Zoom:**
  - Khung cuộn `max-h-[90dvh]` với nút đóng `X` cố định góc trên, ảnh bìa `124px`, thanh cuộn mảnh tối màu.
  - Đối chiếu 3 chỉ số: EXP, Chuỗi ngày, Nhiệm vụ đã xong.
  - **Tích hợp Tab Mini Sơ Đồ Lục Giác:** Biểu đồ radar mini 6 đỉnh sắc nét, phân tích Hệ Thợ Săn của đối thủ.
  - **Chế độ "So kèo với bạn":** Vẽ chồng đa giác năng lực của bạn (nét đứt vàng hổ phách) lên biểu đồ của đối thủ.
  - **RPC Bảo Mật Supabase:** Sử dụng `rpc_get_hunter_ability_stats` (`SECURITY DEFINER`) để đọc an toàn mà không để lộ nội dung nhiệm vụ riêng tư.

---

### 7. 📸 Xuất Thẻ Chiến Tích 9:16 (Hunter Battle Card)
- **Chuẩn tỷ lệ Story 9:16 (1080x1920, pixelRatio: 2):** Thiết kế Dark Fantasy sang trọng, hiển thị trọn vẹn Avatar, Bậc Hạng, Danh hiệu và dải 3 chỉ số.
- **Công nghệ Canvas 2D Pre-compositing Khử Lỗi iOS Safari:**
  - Vẽ và hòa sắc trước ảnh bìa + gradient 4 mốc trên `<canvas>` 540x460 trước khi chụp `toPng`.
  - Loại bỏ hoàn toàn lỗi vệt đen `#000000` và lỗi composite nhiều layer trên iPhone/WebKit.
- **Bọc Logo sắc nét:** Khung bo góc tối màu bảo đảm logo và chữ luôn rõ nét trên mọi nền ảnh bìa sáng.
- **Web Share API tích hợp:** Mở bảng chia sẻ của hệ điều hành để gửi trực tiếp file ảnh sang Zalo, Facebook, Instagram, Messenger.

---

### 8. 🛡️ Live-Ops Quản Trị Viên (Admin Portal)
- **Phân quyền RBAC (`admin` / `user`):** Cung cấp giao diện quản trị toàn diện cho quản trị viên.
- **Quản lý Thợ Săn:** Tìm kiếm, xem chỉ số, cấm/mở khóa tài khoản (Ban), xóa tài khoản vi phạm.
- **Quản lý Asset hệ thống:** Đăng tải logo, huy hiệu rank, icon danh hiệu.
- **Thông báo Mùa giải & Reset Rank:** Đăng thông báo ghim lên BXH, đặt lại mùa giải qua RPC an toàn.

---

### 9. 🧭 Hướng Dẫn Tân Thủ Tương Tác (Interactive Onboarding Tour)
- Kịch bản 9 bước trực quan bằng `Driver.js` tùy biến phong cách Dark Fantasy.
- Bộ selector động thích ứng mượt mà giữa Desktop (Sidebar) và Mobile (Bottom Navigation).

---

## 🎨 HỆ THỐNG MÀU SẮC (DARK FANTASY PALETTE)

| Màu Sắc | Mã HEX | Vai Trò trong Giao Diện |
| :--- | :--- | :--- |
| **Abyssal Base** | `#06141B` | Nền chính toàn trang (Body Background), nền modal, điểm neo gradient |
| **Abyssal Surface** | `#11212D` | Bề mặt thẻ Card nhiệm vụ, thanh KPI tóm tắt, bảng thống kê năng lực |
| **Abyssal Border** | `#253745` | Viền phân tách các khối nội dung, đường lưới lục giác |
| **Steel Accent** | `#4A5C6A` | Viền sáng nhẹ (Hover Border), nút hành động phụ |
| **Subtext Muted** | `#9BA8AB` | Văn bản thứ cấp, nhãn chú thích, đơn vị đo lường |
| **Titanium Text** | `#CCD0CF` | Văn bản chính (Primary Text), tiêu đề mục, giá trị số liệu quan trọng |
| **Fae Gold** | `#F59E0B` | Xu Vàng Fae, chuỗi ngày Streak, nhiệm vụ Boss, Rank Vàng & Thách Đấu |
| **Mana Cyan** | `#22D3EE` | Trí tuệ, điểm EXP bay lên, nút Focus, nét vẽ đa giác năng lực |
| **Life Emerald** | `#10B981` | Thể lực, trạng thái đã hoàn thành, tích xanh, tỷ lệ hoàn tất cao |

---

## 📂 CẤU TRÚC THƯ MỤC NGUỒN

```text
c:\RPG_Todo/
├── dist/                           # Thư mục đầu ra sản phẩm sau khi build (HTML/CSS/JS/SW)
├── public/                         # Assets tĩnh, âm thanh, icon PWA, manifest.webmanifest
├── src/
│   ├── components/
│   │   ├── analytics/              # ProductivityAnalytics.tsx (Lục giác 6 trụ cột & Bảng 3 tầng)
│   │   ├── bento/                  # RightMiniLeaderboardStrip.tsx
│   │   ├── chronicles/             # JournalChronicles.tsx (Nhật ký thợ săn)
│   │   ├── hero/                   # TopBarHero.tsx, PlayerStatusCard.tsx
│   │   ├── layout/                 # MainLayout.tsx, SidebarDesktop.tsx, MobileBottomNav.tsx
│   │   ├── leaderboard/            # LeaderboardTable.tsx, RivalTargetBanner.tsx
│   │   ├── modals/                 # RivalProfileModal.tsx, ChangeCoverModal.tsx, BattleCardPreviewModal.tsx, ...
│   │   ├── profile/                # ProfileView.tsx, HunterBattleCardExport.tsx (Canvas compositing 9:16)
│   │   ├── quests/                 # QuestGrid.tsx, QuestCard.tsx, AddQuestModal.tsx
│   │   ├── shop/                   # RewardShopGrid.tsx, AddShopItemModal.tsx, InventoryModal.tsx
│   │   └── ui/                     # CoinBurstOverlay.tsx, FloatingReward.tsx, SoundToggle.tsx
│   ├── constants/                  # ranks.ts, categories.ts, systemQuests.ts, initialData.ts
│   ├── hooks/                      # useBodyScrollLock.ts, useIsMobile.ts
│   ├── store/                      # useFaeQuestStore.ts (State Zustand & Cloud Sync Engine)
│   ├── types/                      # index.ts (TypeScript interfaces)
│   └── utils/
│       ├── dateUtils.ts            # Xử lý múi giờ địa phương Asia/Ho_Chi_Minh
│       ├── imageExportHelper.ts    # compositeCoverWithGradient, imageUrlToBase64, toPng
│       ├── onboardingTour.ts       # Driver.js 9 bước tương tác
│       ├── soundEffects.ts         # Web Audio API Synth SFX
│       ├── soundEngine.ts          # Bộ phát Ambient Loops thư giãn
│       ├── supabaseClient.ts       # Cấu hình kết nối Supabase
│       └── syncManager.ts          # Đồng bộ Profile & State_json lên đám mây
├── GEMINI.md                       # Quy tắc phát triển an toàn (Git push & Onboarding tour)
├── SRS_TrienKhai.md                # Tài liệu đặc tả kỹ thuật SRS chi tiết
├── supabase_*.sql                  # Bộ mã nguồn thiết lập Database & RPC Supabase
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu Cầu Môi Trường
- **Node.js:** Phiên bản 18.0 trở lên.
- **Trình quản lý gói:** `npm`, `pnpm` hoặc `yarn`.

### 1. Khởi Tạo & Cài Đặt Gói Phụ Thuộc
```bash
# Di chuyển vào thư mục dự án
cd C:\RPG_Todo

# Cài đặt toàn bộ dependencies
npm install
```

### 2. Cấu Hình Biến Môi Trường (`.env`)
Tạo tệp `.env` tại thư mục gốc với các thông số cấu hình:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary Configuration (Tải ảnh đại diện & ảnh bìa)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 3. Thiết Lập Cơ Sở Dữ Liệu Supabase
Mở **Supabase Dashboard ➔ SQL Editor** và chạy các tệp SQL đi kèm trong dự án theo thứ tự:
1. `supabase_schema.sql` — Tạo bảng `profiles`, `user_states` và cấu hình RLS.
2. `supabase_focus_completion.sql` — Hàm nghiệm thu nhiệm vụ và Focus qua RPC.
3. `supabase_hunter_ability_stats.sql` — Hàm RPC `rpc_get_hunter_ability_stats` an toàn để vẽ Sơ Đồ Lục Giác trên Đấu Trường.
4. `supabase_season_announcements.sql` & `supabase_journals.sql` — Bảng thông báo mùa giải và nhật ký.

### 4. Khởi Chạy Ở Chế Độ Phát Triển (Development)
```bash
npm run dev
```
Ứng dụng sẽ khởi chạy tại: `http://localhost:3000` (hoặc cổng hiển thị trên terminal).

### 5. Đóng Gói Ứng Dụng Cho Production (Build)
```bash
npm run build
```
Lệnh này sẽ biên dịch TypeScript và tối ưu hóa tài nguyên qua Vite, tạo ra thư mục `dist/` sẵn sàng triển khai lên Vercel, Netlify hoặc Cloudflare Pages.

### 6. Xem Trước Bản Build (Preview)
```bash
npm run preview
```

---

## 🔒 QUY CHUẨN AN TOÀN & BẢO TRÌ

1. **An Toàn Git (Git Push Safety Rule):**
   - Tuyệt đối **không tự ý `git push`** lên remote repository nếu không có chỉ thị rõ ràng từ người dùng.
   - Luôn kiểm tra `npm run build` thành công trước khi commit cục bộ.
2. **Đồng Bộ Interactive Tour Khi Sửa UI:**
   - Khi chỉnh sửa layout hoặc đổi ID/class, bắt buộc rà soát `src/utils/onboardingTour.ts` và sử dụng selector động thích ứng giữa Desktop và Mobile.
3. **Múi Giờ Địa Phương Thống Nhất:**
   - Toàn bộ phép toán ngày, streak, reset 00:00 đều sử dụng hàm `getTodayString()` hoặc `getLocalDateStr()` trên múi giờ Việt Nam (`Asia/Ho_Chi_Minh`).
4. **Chuẩn Xuất Ảnh Thẻ Không Lỗi Màu:**
   - Luôn dùng kỹ thuật `compositeCoverWithGradient` trên Canvas 2D trước khi chụp để đảm bảo tương thích 100% trên WebKit / iOS Safari.

---

## 📜 GIẤY PHÉP (LICENSE)
Dự án được phát triển và phát hành dưới giấy phép **MIT License**. Bạn được toàn quyền sử dụng, sửa đổi và phân phối theo các điều khoản của giấy phép.

<div align="center">
  <sub>Được xây dựng với tất cả tâm huyết bởi FaeQuest Core Team ⚔️ Biến Kỷ Luật Thành Chiến Tích.</sub>
</div>
