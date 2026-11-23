# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC TRIỂN KHAI HỆ THỐNG
**Tên dự án:** FaeQuest — Nền Tảng Quản Lý Nhiệm Vụ & Năng Suất Nhập Vai (Gamified RPG Productivity Platform)  
**Phiên bản hiện tại:** 2.0.0 (Production Release / Full-stack Cloud-Sync & Mobile PWA)  
**Tác giả & Đội ngũ:** FaeQuest Core Engineering Team  
**Ngôn ngữ giao diện:** Tiếng Việt (Bản địa hóa 100%)  
**Ngày cập nhật:** Tháng 11/2026  

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Tầm nhìn & Mục tiêu sản phẩm
**FaeQuest** là nền tảng quản lý công việc và rèn luyện năng suất hằng ngày (Personal Productivity & Task Management) được xây dựng dựa trên triết lý **Gamification (Trò chơi hóa)** chuyên sâu theo phong cách Dark Fantasy RPG cổ điển. 

Hệ thống chuyển đổi các nhiệm vụ, thói quen và mục tiêu kỷ luật thường nhật thành hành trình chinh phục thử thách của một **Thợ Săn Fae**:
- Tích lũy điểm kinh nghiệm (**EXP**) để thăng cấp qua **7 Bậc Rank** danh giá (từ *Đồng* đến *Thách Đấu*).
- Nhận thưởng **Xu Vàng Fae** khi hoàn thành nhiệm vụ và lên cấp để đổi lấy các phần thưởng tự thưởng ngoài đời thực trong **Cửa Hàng Tự Thưởng (Reward Shop)**.
- Đo lường và cân bằng năng lực bản thân qua **Sơ Đồ Lục Giác Năng Lực 6 Trụ Cột** (thang 1.0 – 5.0) và biểu đồ phong độ 7 ngày.
- Đắm chìm vào không gian làm việc sâu với **Fae Focus (Pomodoro Engine)** tích hợp âm thanh môi trường thư giãn (Ambient Sounds).
- Đua tài trên **Bảng Xếp Hạng Cộng Đồng (Community Leaderboard)**, so sánh chỉ số và so kèo lục giác trực quan với các đối thủ khác.
- Xuất **Thẻ Chiến Tích 9:16 (Hunter Battle Card)** chuẩn độ phân giải cao để chia sẻ thành quả lên mạng xã hội (TikTok, Instagram, Facebook Story).

### 1.2. Ngăn xếp Công nghệ Hiện tại (Current Production Tech Stack)
| Thành phần | Công nghệ / Thư viện | Vai trò kỹ thuật |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite 6 + TypeScript** | Kiến trúc SPA hiện đại, compile siêu tốc, type-safe toàn bộ hệ thống. |
| **Styling & Animation** | **Tailwind CSS v3 + Tailwind Animate + Framer Motion** | Giao diện Dark Fantasy huyền bí, animation chuyển cảnh lò xo (`EASING_SPRING`), tương thích responsive mọi kích thước màn hình. |
| **State Management** | **Zustand v5 (`persist` middleware)** | Quản lý state tập trung, tự động lưu cục bộ vào `localStorage` và đồng bộ ngầm hai chiều với Supabase. |
| **Backend & Cloud DB** | **Supabase (PostgreSQL 15 + PostgREST + Auth + Storage)** | Lưu trữ Profile người chơi, State đám mây (`user_states`), RPC functions bảo mật (`SECURITY DEFINER`), Leaderboard realtime. |
| **Asset Cloud CDN** | **Cloudinary API (Upload & Delete)** | Tải lên, tối ưu nén ảnh đại diện và ảnh bìa tùy chỉnh, tự động dọn dẹp ảnh cũ để tiết kiệm tài nguyên. |
| **Export Engine** | **HTML5 Canvas 2D + html-to-image** | Pre-compositing ảnh bìa và lớp chuyển sắc bằng Canvas 2D trước khi chụp để khử hoàn toàn lỗi đen kịt trên iOS Safari / WebKit. |
| **Audio Synthesizer** | **Web Audio API Engine** | Tổng hợp âm thanh SFX hoàn thành nhiệm vụ, mua đồ, thăng hạng và bộ lọc tiếng ồn trắng (Mưa rơi, Lửa trại, Gió rừng, Cyber, Sóng biển). |
| **Mobile PWA** | **vite-plugin-pwa + Workbox** | Đóng gói Progressive Web App, Service Worker precache tài nguyên, hỗ trợ cài đặt trực tiếp lên iOS / Android / Desktop và chạy mượt khi mất mạng. |
| **Onboarding Guide** | **Driver.js** | Kịch bản hướng dẫn tân thủ 9 bước tương tác, selector động chuyển đổi giữa Desktop Sidebar và Mobile Bottom Nav. |

---

## 2. HỆ THỐNG THIẾT KẾ & BẢNG MÀU DARK FANTASY (DESIGN SYSTEM)

Giao diện của FaeQuest V2.0 sử dụng bảng màu **Dark Fantasy Abyssal** mang phong cách huyền bí, sang trọng và tối ưu độ tương phản cho mắt người dùng khi làm việc ban đêm:

### 2.1. Bảng mã màu chuẩn hệ thống (Core Design Tokens)
| Tên Token | Mã HEX | Giá trị RGB | Ứng dụng trong Giao diện |
| :--- | :--- | :--- | :--- |
| **Abyssal Base** | `#06141B` | `rgba(6, 20, 27, 1)` | Nền chính toàn trang (Body Background), nền các ô nhập liệu sâu, nền thẻ modal, điểm neo gradient. |
| **Abyssal Surface** | `#11212D` | `rgba(17, 33, 45, 1)` | Bề mặt thẻ Card nhiệm vụ, thanh KPI tóm tắt, bảng thống kê năng lực, sidebar nền. |
| **Abyssal Border** | `#253745` | `rgba(37, 55, 69, 1)` | Viền phân tách các khối nội dung, đường lưới lục giác, dải ngăn cách các cột chỉ số. |
| **Steel Accent** | `#4A5C6A` | `rgba(74, 92, 106, 1)` | Viền sáng nhẹ (Hover Border), nút hành động phụ, badge danh hiệu mặc định. |
| **Subtext Muted** | `#9BA8AB` | `rgba(155, 168, 171, 1)` | Văn bản thứ cấp, nhãn chú thích, thời gian, đơn vị đo lường, phụ đề mô tả. |
| **Titanium Text** | `#CCD0CF` | `rgba(204, 208, 207, 1)` | Văn bản chính (Primary Text), tiêu đề mục, giá trị số liệu quan trọng. |
| **Fae Gold / Amber** | `#F59E0B` | `rgba(245, 158, 11, 1)` | Xu Vàng Fae, chuỗi ngày Streak, nhiệm vụ Trùm Boss, biểu tượng Rank Vàng & Thách Đấu, thông báo thăng hạng. |
| **Mana Cyan** | `#22D3EE` | `rgba(34, 211, 238, 1)` | Trí tuệ, điểm EXP bay lên, nút Focus tập trung, đường nét đa giác năng lực, tab kích hoạt. |
| **Life Emerald** | `#10B981` | `rgba(16, 185, 129, 1)` | Thể lực, trạng thái đã hoàn thành, tích xanh, tỷ lệ hoàn tất công việc cao. |

### 2.2. Quy chuẩn Typography & Phông chữ
- **RPG Display Font:** `Cinzel`, `Cinzel Decorative` (Class: `font-rpg`) — Dùng cho Tên ứng dụng, Bậc Rank, Tiêu đề phần thưởng, Tên Thợ Săn trên Thẻ Chiến Tích.
- **Body UI Font:** `Plus Jakarta Sans`, `Inter`, `sans-serif` (Class: `font-sans`) — Dùng cho nội dung nhiệm vụ, mô tả, nút bấm và nhãn chức năng.
- **Data & Numeric Font:** `JetBrains Mono`, `monospace` (Class: `font-mono`) — Dùng cho điểm EXP, số Xu, đếm ngược Pomodoro, chỉ số thống kê đối chiếu.

---

## 3. ĐẶC TẢ CHI TIẾT 11 PHÂN HỆ CHỨC NĂNG (SYSTEM MODULES)

### 3.1. Phân hệ 1: Quản Lý Nhiệm Vụ Thợ Săn (Quest Board)
- **Tạo & Quản lý lệnh nhiệm vụ:**
  - Nhập tiêu đề thử thách, mô tả ghi chú tùy chọn.
  - Phân loại theo **5 Nhóm Hoạt Động**:
    1. `hoc-tap`: Học tập, nghiên cứu tri thức (Icon Sách).
    2. `cong-viec`: Công việc chuyên môn, dự án (Icon Cặp táp).
    3. `the-luc`: Thể dục, rèn luyện thể chất (Icon Tạ).
    4. `ca-nhan`: Kế hoạch sinh hoạt cá nhân, gia đình (Icon Trái tim).
    5. `sang-tao`: Sáng tạo nội dung, nghệ thuật, thiết kế (Icon Bảng vẽ).
  - Chọn **4 Cấp Độ Thử Thách**:
    - **Khởi Động (Dễ):** `+30 EXP`, `+2 Xu` (Thời lượng < 15 phút).
    - **Tiêu Chuẩn (Vừa):** `+60 EXP`, `+5 Xu` (Thời lượng 30 – 60 phút).
    - **Thử Thách (Khó):** `+110 EXP`, `+10 Xu` (Đòi hỏi tập trung cao độ).
    - **Trùm Cuối Ngày (Boss):** `+200 EXP`, `+20 Xu` (Nhiệm vụ đột phá quan trọng nhất trong ngày).
- **Phân tách Thời Gian & Lập Lịch (`target_date`):**
  - Hệ thống tab kép: **"Hôm nay"** và **"Ngày mai"**.
  - Nhiệm vụ được gắn cờ `target_date` theo ngày địa phương `YYYY-MM-DD`. Nếu nhiệm vụ được lên lịch cho "Ngày mai", hệ thống kích hoạt cơ chế khóa an toàn: **không cho phép nghiệm thu trước hạn**.
- **Cơ chế Lặp Lại Định Kỳ (Daily Recurring Tasks):**
  - Đánh dấu nhiệm vụ là "Lặp lại hằng ngày". Khi bước sang ngày mới (sau 00:00 múi giờ địa phương), hệ thống tự động đưa các nhiệm vụ lặp lại về trạng thái "Chưa xong" mà không làm mất lịch sử EXP đã tích lũy từ trước.
- **Ngưỡng Giới Hạn Thể Lực Hằng Ngày (Anti-Grind Cap):**
  - Nhằm bảo vệ sức khỏe và khuyến khích kỷ luật bền vững, hệ thống giới hạn tối đa **20 nhiệm vụ nhận thưởng EXP/Xu mỗi ngày**.
  - Từ nhiệm vụ thứ 21 trở đi trong ngày, người chơi vẫn có thể đánh dấu hoàn thành để ghi nhận tiến độ công việc, nhưng hệ thống sẽ hiển thị thông báo dịu mắt và không cộng thêm EXP/Xu ảo.
- **Cơ chế Khóa Chống Gian Lận & Thao Tác Nhanh (Anti-Cheat & Concurrency Lock):**
  - Chặn spam click liên tục (tự động khóa tạm thời 30 giây nếu bấm hoàn thành quá 2 lần trong 1 phút).
  - Nhiệm vụ mới tạo dưới 2 phút phải trải qua ngưỡng thời gian tôi luyện thực tế trước khi nghiệm thu.

---

### 3.2. Phân hệ 2: Fae Focus (Pomodoro Deep Work Engine)
- **Tích hợp đồng hồ tập trung vào từng nhiệm vụ:**
  - Cho phép người chơi kích hoạt chế độ **Fae Focus** với thời lượng tùy biến (15, 25, 45, 60, 90, 120 phút) gắn liền với nhiệm vụ được chọn.
  - Hiển thị đồng hồ đếm ngược với hiệu ứng vòng tròn tiến trình neon ma thuật.
- **Bộ máy Âm thanh Thư giãn Nền (Ambient Sound Engine):**
  - Tự động phát âm thanh môi trường thư giãn không phụ thuộc file tải ngoài: *Tiếng mưa rơi (Rain)*, *Tiếng lửa trại (Campfire)*, *Tiếng gió rừng (Nature)*, *Sóng âm viễn tưởng (Cyberpunk/Binaural)*.
  - Tự động dừng âm thanh và phát chuông báo hoàn thành khi hết giờ.
- **Đồng bộ Media Session & Web Notification:**
  - Đồng bộ trạng thái đếm ngược lên thanh điều khiển âm thanh hệ thống (Lock screen trên điện thoại và thanh Notification trên Desktop).
  - Gửi thông báo trình duyệt khi phiên tập trung kết thúc thành công.
- **Cơ chế cộng thưởng Focus:** Thưởng thêm lượng EXP và Xu tương ứng với số phút tập trung thực tế.

---

### 3.3. Phân hệ 3: Chuỗi Ngày Kỷ Luật & Hệ Thống 7 Bậc Rank
- **Chuỗi Ngày Kỷ Luật (Daily Streak):**
  - Tính toán dựa trên múi giờ thực tế của thiết bị (`Asia/Ho_Chi_Minh`), xác định người dùng hoàn thành ít nhất 1 nhiệm vụ mỗi ngày.
  - Nếu chuỗi $\ge 3$ ngày liên tiếp: Kích hoạt hiệu ứng **Lửa Kỷ Luật** và tặng thêm **+20% EXP Thưởng Chuỗi** cho tất cả nhiệm vụ hoàn thành.
  - Tự động bảo lưu hoặc nhắc nhở duy trì chuỗi khi bước sang ngày mới.
- **Hệ Thống 7 Bậc Rank Thợ Săn:**
  | Bậc Rank | Mã Rank | Ngưỡng EXP | Thưởng Xu Thăng Hạng | Danh Hiệu / Triết Lý Rèn Luyện |
  | :---: | :--- | :---: | :---: | :--- |
  | **1** | `dong` (Đồng) | `0 – 199` | Mặc định | Tân Binh Gai Đỏ — Bước đầu xây dựng tính tự giác. |
  | **2** | `bac` (Bạc) | `200 – 499` | `+50 Xu` | Kiếm Sĩ Tập Sự — Ý chí bắt đầu định hình rõ nét. |
  | **3** | `vang` (Vàng) | `500 – 999` | `+100 Xu` | Chiến Binh Ánh Kim — Thói quen tốt đã ăn sâu vào tiềm thức. |
  | **4** | `luc-bao` (Lục Bảo) | `1000 – 1799` | `+160 Xu` | Thợ Săn Lục Bảo — Năng suất vượt trội và bền bỉ. |
  | **5** | `cao-thu` (Cao Thủ) | `1800 – 2799` | `+250 Xu` | Bậc Thầy Thời Gian — Hoàn toàn làm chủ tiến độ cuộc sống. |
  | **6** | `dai-cao-thu` (Đại Cao Thủ) | `2800 – 3999` | `+400 Xu` | Huyền Thoại Hắc Ám — Bản lĩnh thép không gì lay chuyển. |
  | **7** | `thach-dau` (Thách Đấu) | `4000+` | `+700 Xu` | Thần Thoại Tối Cao — Biểu tượng sống của kỷ luật tuyệt đối. |
- **Modal Chúc Mừng Thăng Cấp (Rank Up Celebration):**
  - Tự động bật pháo hoa ăn mừng (`canvas-confetti`), hiển thị huy hiệu SVG phát sáng, phát âm thanh kèn thắng trận và chuyển thẳng Xu thưởng vào ví.

---

### 3.4. Phân hệ 4: Danh Hiệu Thợ Săn & Thành Tựu Mùa Giải (Titles & Achievements)
- **Hệ thống danh hiệu động:**
  - Danh hiệu gắn liền với độ hiếm: *Hiếm (Rare - Xanh lam)*, *Sử Thi (Epic - Tím)*, *Huyền Thoại (Legendary - Vàng kim)*.
  - Tự động mở khóa khi đạt các cột mốc: *Kẻ Chế Ngự Thời Gian* (hoàn thành phiên Focus), *Thể Phách Kim Cương* (chuỗi rèn luyện thể lực), *Học Giả Huyền Bí* (nhiệm vụ học tập), *Chiến Binh Bất Khuất* (chuỗi streak cao).
- **Trang bị & Hiển thị:**
  - Danh hiệu được chọn sẽ hiển thị trang trọng trên Top Navigation Bar, Thẻ Thợ Săn trong Hồ Sơ, Bảng Xếp Hạng Cộng Đồng và Thẻ Chiến Tích xuất ảnh.

---

### 3.5. Phân hệ 5: Cửa Hàng Tự Thưởng & Kho Vé (Reward Shop & Inventory)
- **Cửa Hàng Tự Thưởng Cá Nhân Hóa:**
  - Danh mục quà tặng mẫu: *Ăn món yêu thích (10 Xu)*, *Trà sữa/Cà phê (15 Xu)*, *Chơi Game 1 tiếng (25 Xu)*, *Xem phim rạp (50 Xu)*, *Mua đồ công nghệ/thời trang (120 Xu)*, *Nghỉ xả hơi - Cheat Day (250 Xu)*.
  - Cho phép người chơi tự thiết lập món quà mơ ước mới: Tên quà, Mô tả, Giá quy đổi Xu và Biểu tượng Emoji.
- **Đồng bộ hóa tức thì với Supabase:**
  - Mọi thao tác thêm hoặc xóa vật phẩm trong Shop đều được tự động lưu vào state và kích hoạt hàm đồng bộ mây (`syncToCloud`) để bảo toàn khi F5 hoặc đổi thiết bị.
- **Kho Vé Thưởng (Inventory):**
  - Mua quà bằng Xu sẽ tạo ra một tấm "Vé Thưởng Chưa Sử Dụng". Khi hoàn thành việc tự thưởng ngoài đời thực, người chơi bấm "Sử dụng ngay" để lưu vào lịch sử hoàn tất.

---

### 3.6. Phân hệ 6: Đấu Trường & Bảng Xếp Hạng Cộng Đồng (Leaderboard & Rivals)
- **Bảng Xếp Hạng Cộng Đồng Realtime:**
  - Hiển thị Top 50 Thợ Săn có EXP cao nhất từ bảng `profiles` trên Supabase (tự động loại trừ các tài khoản admin quản trị để đảm bảo tính công bằng).
  - Tích hợp các đối thủ giả lập (AI Rivals) để tạo sự so kè liên tục.
- **Modal Hồ Sơ Mini Của Đối Thủ (`RivalProfileModal`):**
  - **Khung cuộn chống tràn responsive ở mọi mức zoom:** Container bọc `max-h-[90dvh]` với nút đóng `X` cố định góc trên, ảnh bìa `124px`, thanh cuộn mảnh tối màu, không cắt xén chữ.
  - **So sánh 3 chỉ số đối chiếu:** Kinh nghiệm (`exp`), Chuỗi ngày (`streak`), Nhiệm vụ đã xong (`completedTasks`) kèm nhãn chênh lệch (Dẫn trước / Bám đuổi / Bằng nhau).
  - **Tích hợp Tab Mini Sơ Đồ Lục Giác Năng Lực:**
    - Nút icon Lục Giác đặt gọn gàng cạnh Bậc Rank.
    - Vẽ biểu đồ radar 6 chỉ số mini (`viewBox 320x270`, bảo đảm đỉnh Kỷ Luật ở đáy cách mép tận 49px, không bao giờ bị cắt).
    - Hiển thị Hệ Thợ Săn của đối thủ và điểm trung bình `Avg / 5.0`.
  - **Chế độ "So kèo với bạn":** Vẽ đè đa giác năng lực nét đứt màu vàng hổ phách của chính người dùng lên biểu đồ đối thủ để trực quan hóa tương quan sức mạnh.
  - **Bảo mật RLS Supabase qua RPC:** Sử dụng hàm `public.rpc_get_hunter_ability_stats` (`SECURITY DEFINER`) để đọc an toàn thống kê danh mục mà không để lộ tiêu đề nhiệm vụ riêng tư.

---

### 3.7. Phân hệ 7: Hồ Sơ Cá Nhân & Phân Tích Năng Suất (Profile & Analytics)
- **Quản lý Hồ Sơ & Tùy biến Giao diện:**
  - Chỉnh sửa tên nhân vật, Mã định danh Thợ Săn (`hunter_id`).
  - Thay đổi Ảnh đại diện và Ảnh bìa cá nhân (tải ảnh từ máy lên Cloudinary CDN hoặc chọn từ Bộ sưu tập cảnh quan Dark Fantasy).
- **Sơ Đồ Lục Giác Năng Lực 6 Trụ Cột (Thang Điểm 1.0 – 5.0):**
  - 6 chỉ số đại diện:
    * **Trí Tuệ** ➔ Tính từ nhóm `Học tập`.
    * **Sự Nghiệp** ➔ Tính từ nhóm `Công việc`.
    * **Thể Chất** ➔ Tính từ nhóm `Thể lực`.
    * **Tự Chủ** ➔ Tính từ nhóm `Cá nhân`.
    * **Sáng Tạo** ➔ Tính từ nhóm `Sáng tạo`.
    * **Kỷ Luật** ➔ Tổng hợp từ `Chuỗi Streak` + `Phiên Focus` + `Nhiệm vụ hoàn thành`.
  - **Công thức tăng tiến mượt theo mốc EXP:**
    $$\text{0 EXP} \rightarrow 1.0 \quad|\quad \text{100 EXP} \rightarrow 2.0 \quad|\quad \text{300 EXP} \rightarrow 3.0 \quad|\quad \text{600 EXP} \rightarrow 4.0 \quad|\quad \ge \text{1000 EXP} \rightarrow 5.0$$
  - **Cơ chế bảo toàn lịch sử không bị reset về `0/0`:** Hệ thống tự động bù đắp dữ liệu dựa trên `completedTotal` và tổng `exp` tích lũy vĩnh viễn, người dùng xóa bớt thẻ nhiệm vụ cũ ngoài danh sách thì điểm năng lực vẫn giữ nguyên độ nở đều đặn.
  - **Khung Phân Tích Thiên Hướng Thợ Săn:**
    - Tự động nhận diện 7 Hệ Thợ Săn: *Học Giả Hắc Ám*, *Chiến Binh Thép*, *Chiến Lược Gia*, *Hành Giả Tĩnh Tâm*, *Nghệ Sĩ Hư Không*, *Bậc Thầy Thiết Luật*, hoặc *Thợ Săn Toàn Diện* (nếu chỉ số đồng đều $\le 0.5$).
    - Cung cấp 2 thẻ định hướng: **Điểm Mạnh Nhất** (phát huy) và **Cần Bồi Đắp** (gợi ý tạo thêm nhiệm vụ thuộc nhóm còn thiếu).
- **Bảng Phân Bổ Hoạt Động & Độ Khó (3 tầng dữ liệu):**
  - **Tầng 1:** Tiến độ 5 nhóm hoạt động với màu gradient nhận diện riêng biệt, hiển thị `+EXP` và điểm `⭐ X.X/5.0`.
  - **Tầng 2:** Phân bổ theo 4 độ khó bằng **Stacked Progress Bar** phân đoạn màu kèm 4 ô thống kê Dễ, Vừa, Khó, Trùm Cuối.
  - **Tầng 3:** Biểu đồ phong độ 7 ngày qua (Hôm nay màu vàng hoàng kim, ngày có hoạt động màu ngọc lam, ngày nghỉ màu tối mờ).

---

### 3.8. Phân hệ 8: Xuất Thẻ Chiến Tích 9:16 (Hunter Battle Card Export)
- **Tỷ lệ chuẩn 9:16 (1080x1920) tối ưu Story & TikTok:**
  - Bố cục 4 tầng cân đối: Thanh định danh thương hiệu, Tâm điểm nhân vật (Avatar lớn 136px, Bậc hạng, Danh hiệu), Khung Bậc Hạng & Dải 3 chỉ số chiến tích, Chân thẻ khế ước.
- **Công nghệ Canvas 2D Pre-compositing khử lỗi đen kịt trên iOS Safari / WebKit:**
  - Thay vì xếp chồng nhiều lớp `<div>` gradient đè lên `<img>` trong `<foreignObject>` (nguyên nhân gây lỗi composite và vệt đen `#000000` trên iPhone), hệ thống sử dụng hàm `compositeCoverWithGradient`: vẽ trực tiếp ảnh bìa lên `<canvas>` 540x460 và hòa sắc với gradient 4 mốc chuẩn về `#06141B`.
  - Loại bỏ hoàn toàn các class `blur`, `mix-blend-*`, `backdrop-blur-*` và tuyệt đối không dùng từ khóa `transparent`.
- **Bọc Logo sắc nét:** Cụm Logo và chữ `FAEQUEST — THẺ CHIẾN TÍCH` được bọc trong khung bo góc tối màu, bảo đảm rõ nét trên cả những ảnh bìa sáng màu.
- **Cơ chế Cache `profileSignature` `v4_`:** Mở modal xem trước tức thì (0ms) nếu thông số không đổi, tự động làm mới khi có thay đổi.
- **Hỗ trợ Web Share API:** Bấm nút Chia sẻ sẽ mở thẳng bảng share của điện thoại (Zalo, Facebook, Instagram Stories, Lưu ảnh về máy).

---

### 3.9. Phân hệ 9: Nhật Ký Thợ Săn (Chronicles / Journal)
- **Nhật ký rèn luyện cá nhân:**
  - Người chơi ghi lại cảm nghĩ, bài học và đúc kết sau một ngày nỗ lực hoàn thành công việc.
  - Chọn 5 trạng thái tâm trạng: *Tuyệt vời*, *Tốt*, *Bình thường*, *Căng thẳng*, *Tệ*.
  - Lưu trữ đám mây an toàn qua bảng `journals` trên Supabase.

---

### 3.10. Phân hệ 10: Hướng Dẫn Tân Thủ Tương Tác (Interactive Onboarding Tour)
- **Kịch bản trải nghiệm người dùng mới 9 bước:**
  - Sử dụng thư viện `Driver.js` tùy biến giao diện Dark Fantasy.
  - Dẫn dắt người dùng khám phá: Top Navigation, Lệnh Nhiệm Vụ, Nút Thêm Lệnh, Chế Độ Lọc, Fae Focus, Cửa Hàng Tự Thưởng, Đấu Trường BXH, Hồ Sơ Cá Nhân & Xuất Thẻ Chiến Tích.
- **Selector động thích ứng màn hình:**
  - Tự động chuyển đổi selector giữa Sidebar Desktop và Bottom Navigation Mobile (`() => window.innerWidth >= 768 ? ... : ...`), đảm bảo không có selector mồ côi hay lỗi giật khung hình.
  - Lưu trạng thái `has_seen_tutorial` vào database Supabase.

---

### 3.11. Phân hệ 11: Quản Trị Live-Ops (Admin Portal)
- **Phân quyền người dùng (RBAC):**
  - Nhận diện quyền Quản trị viên (`role = 'admin'`).
  - Menu Portal chuyên dụng mở ra từ Avatar/Cài đặt.
- **Các tính năng quản trị:**
  - **Quản lý Thợ Săn:** Tìm kiếm, xem chi tiết EXP, Xu, Chuỗi ngày, Tạm khóa tài khoản (Ban), Mở khóa, hoặc Xóa tài khoản vi phạm.
  - **Quản lý Asset hệ thống:** Đăng tải và quản lý logo, rank icon, title badges.
  - **Thông báo Mùa giải:** Đăng bài viết, ghim thông báo lên đỉnh Bảng Xếp Hạng.
  - **Reset Mùa Giải:** Đặt lại mốc rank về mùa mới qua RPC `rpc_admin_reset_season_rank`.
  - **Hòm thư điều hành:** Gửi thư cảnh báo hoặc quà tặng tới từng người chơi.

---

## 4. KIẾN TRÚC DỮ LIỆU & SUPABASE SCHEMA (DATABASE ARCHITECTURE)

### 4.1. Bảng Dữ Liệu Cốt Lõi (Core Tables)
```sql
-- 1. Bảng public.profiles (Thông tin công khai & Bảng Xếp Hạng)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  exp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 25,
  stars INTEGER DEFAULT 0,
  rank_id TEXT DEFAULT 'dong',
  equipped_title TEXT DEFAULT 'title_tan_binh_gai_do',
  streak INTEGER DEFAULT 0,
  last_streak_date TEXT,
  completed_tasks_count INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  has_seen_tutorial BOOLEAN DEFAULT FALSE,
  banned_until TIMESTAMPTZ,
  ban_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index tối ưu hóa truy vấn Top EXP cho BXH
CREATE INDEX IF NOT EXISTS idx_profiles_exp ON public.profiles (exp DESC);

-- 2. Bảng public.user_states (Snapshot lưu trữ toàn bộ trạng thái chi tiết của user)
CREATE TABLE IF NOT EXISTS public.user_states (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng public.journals (Nhật ký hành trình thợ săn)
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'Tốt',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng public.season_announcements (Thông báo mùa giải trên BXH)
CREATE TABLE IF NOT EXISTS public.season_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_tag TEXT NOT NULL DEFAULT 'Mùa 2',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2. Các Hàm PostgreSQL An Toàn (Stored Procedures / RPC)
- **`rpc_complete_quest` (`SECURITY DEFINER`):** Nghiệm thu nhiệm vụ, tính toán EXP thưởng chuỗi, cộng Xu, thăng cấp Rank và kiểm tra thời lượng Focus tập trung trong một transaction ACID duy nhất.
- **`rpc_get_hunter_ability_stats(p_hunter_id text)` (`SECURITY DEFINER`):** Trích xuất an toàn số liệu hoàn thành và EXP theo từng danh mục của người chơi bất kỳ để vẽ Sơ Đồ Lục Giác trên Đấu Trường mà không để lộ nội dung nhiệm vụ riêng tư.
- **`rpc_admin_reset_season_rank` (`SECURITY DEFINER`):** Cho phép tài khoản Admin đặt lại EXP và Bậc Rank của toàn server khi bắt đầu mùa giải mới.

---

## 5. MÔ HÌNH DỮ LIỆU FRONTEND (TYPESCRIPT DEFINITIONS)

```typescript
export type TaskCategory = 'hoc-tap' | 'cong-viec' | 'the-luc' | 'ca-nhan' | 'sang-tao';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'boss';
export type RankId = 'dong' | 'bac' | 'vang' | 'luc-bao' | 'cao-thu' | 'dai-cao-thu' | 'thach-dau';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  completed: boolean;
  rewardClaimed?: boolean;
  isDailyRecurring?: boolean;
  focusDuration?: number | null; // Số phút Pomodoro
  focusRewardClaimed?: boolean;
  createdAt: number;
  completedAt?: number;
  completionDate?: string;
  target_date?: string; // YYYY-MM-DD
}

export interface CategoryStatRecord {
  completed: number;
  expGained: number;
}

export interface DailyActivityRecord {
  completedCount: number;
  expGained: number;
}

export interface UserStateCloud {
  playerName: string;
  avatarUrl?: string;
  coverUrl?: string;
  exp: number;
  coins: number;
  stars?: number;
  completedTotal: number;
  streakDays: number;
  lastStreakDate?: string;
  lastActiveDate?: string;
  dailyCompletedCount: number;
  tasks: Task[];
  shopItems: ShopItem[];
  inventory: InventoryTicket[];
  focusSessionsCompleted: number;
  cumulativeCategoryStats?: Record<TaskCategory, CategoryStatRecord>;
  cumulativeDifficultyStats?: Record<TaskDifficulty, number>;
  dailyActivityHistory?: Record<string, DailyActivityRecord>;
}
```

---

## 6. CẤU TRÚC THƯ MỤC NGUỒN (PROJECT DIRECTORY TREE)

```text
c:\RPG_Todo/
├── public/                         # Assets tĩnh, âm thanh, icon PWA, manifest.webmanifest
├── src/
│   ├── components/
│   │   ├── analytics/              # ProductivityAnalytics.tsx (Lục giác 6 trụ cột & 3 tầng dữ liệu)
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
│   ├── store/                      # useFaeQuestStore.ts (State Zustand tập trung & Cloud Sync Engine)
│   ├── types/                      # index.ts (TypeScript interfaces)
│   └── utils/
│       ├── dateUtils.ts            # Xử lý múi giờ địa phương Asia/Ho_Chi_Minh
│       ├── imageExportHelper.ts    # compositeCoverWithGradient, imageUrlToBase64, toPng
│       ├── onboardingTour.ts       # Driver.js 9 bước tương tác
│       ├── soundEffects.ts         # Web Audio API Synth SFX
│       ├── soundEngine.ts          # Bộ phát Ambient Loops thư giãn
│       ├── supabaseClient.ts       # Cấu hình kết nối Supabase
│       └── syncManager.ts          # Đồng bộ Profile & State_json lên đám mây
├── GEMINI.md                       # Bộ quy tắc phát triển dự án (Git push safety & Tour sync)
├── SRS_TrienKhai.md                # Tài liệu SRS & Hướng dẫn triển khai hệ thống (Tệp này)
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 7. QUY CHUẨN AN TOÀN TRIỂN KHAI & BẢO TRÌ (DEV & OPS RULES)

1. **Quy tắc An Toàn Git & Remote Repository:**
   - **Tuyệt đối không tự ý `git push`**: Chỉ thực hiện lệnh đẩy code lên GitHub khi và chỉ khi có chỉ thị rõ ràng từ người dùng.
   - Luôn chạy kiểm tra `npm run build` thành công và tạo local commit trước khi thực hiện các bước tiếp theo.
2. **Quy tắc Toàn Vẹn Hướng Dẫn Tân Thủ (Interactive Tour):**
   - Bất cứ khi nào thay đổi layout UI, ID hoặc class cốt lõi, bắt buộc rà soát file `src/utils/onboardingTour.ts` để cập nhật selector động tương ứng, tránh để selector mồ côi gây lỗi trên Desktop hoặc Mobile.
3. **Quy chuẩn Múi Giờ Hệ Thống:**
   - Mọi phép toán liên quan đến Streak, Nhiệm vụ hôm nay/ngày mai, Giới hạn thể lực đều phải sử dụng hàm tiện ích `getTodayString()` hoặc `getLocalDateStr()` để đảm bảo sự đồng bộ trên múi giờ địa phương Việt Nam (`Asia/Ho_Chi_Minh`), không phụ thuộc vào giờ UTC của máy chủ.
4. **Quy chuẩn Xuất Ảnh Không Lỗi Màu:**
   - Luôn sử dụng kỹ thuật gộp Canvas 2D (`compositeCoverWithGradient`) trước khi chụp `toPng`, tránh dùng các thuộc tính CSS `blur`, `backdrop-blur-*` hay từ khóa `transparent` trong các node xuất ảnh nhằm đảm bảo tính tương thích 100% trên thiết bị iOS Safari.
