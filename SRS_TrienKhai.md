# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & HƯỚNG DẪN TRIỂN KHAI TRÊN ANTIGRAVITY
**Tên dự án:** FaeQuest — Hệ Thống Quản Lý Nhiệm Vụ Nhập Vai (Gamified RPG Todo List)  
**Phiên bản:** 2.0 (Bản nâng cấp Full-stack / Modern Web App cho Antigravity)  
**Ngôn ngữ giao diện:** Tiếng Việt  

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
### 1.1. Mục tiêu sản phẩm
**FaeQuest** là ứng dụng quản lý công việc hằng ngày (Todo List) kết hợp cơ chế **Gamification (Trò chơi hóa)** theo phong cách Dark Fantasy RPG. Mục tiêu cốt lõi là biến những công việc nhàm chán hằng ngày thành hành trình tích lũy kinh nghiệm (EXP), leo 7 bậc Rank danh giá, nhận Xu thưởng khi thăng hạng để tự thưởng bản thân ngoài đời thực và cạnh tranh thứ hạng cùng các đối thủ giả lập (AI Rivals).

### 1.2. Đề xuất Công nghệ nâng cấp trên Antigravity (Tech Stack)
Để nâng cấp từ bản Single-File HTML lên ứng dụng chuyên nghiệp trên Antigravity, khuyến nghị sử dụng:
- **Framework:** Next.js 14+ (App Router) hoặc React + Vite + TypeScript.
- **Styling:** Tailwind CSS + Framer Motion (hiệu ứng chuyển cảnh, lên cấp, thanh tiến trình mượt mà) + Canvas Confetti (pháo hoa khi lên Rank).
- **Icons:** Lucide React hoặc Phosphor Icons (`@phosphor-icons/react`).
- **Quản lý State & Lưu trữ:** Zustand (với middleware `persist` lưu vào `localStorage` hoặc đồng bộ Supabase/Firebase nếu muốn mở rộng đăng nhập).
- **Âm thanh:** Web Audio API Synthesizer (không phụ thuộc file âm thanh ngoài, tự tạo âm thanh khi hoàn thành task, mua đồ, lên Rank).

---

## 2. HỆ THỐNG BẢNG MÀU & DESIGN TOKENS (COLOR PALETTE SPEC)
Bảng màu được lấy cảm hứng trực tiếp từ bộ **Palette For Illustration #7 (2026)**, mang phong cách huyền bí, cổ điển nhưng nổi bật:

### 2.1. Bảng mã màu gốc (Core Palette)
| Tên Màu | Mã HEX | Mã RGB | Mã CMYK | Vai trò trong Giao diện (UI Role) |
| :--- | :--- | :--- | :--- | :--- |
| **Fae Fruit** | `#D97352` | `217, 119, 82` | `12, 64, 68, 2` | **Primary Accent / CTA:** Nút bấm chính, thanh EXP, biểu tượng Xu vàng, viền nổi bật, thông báo lên cấp. |
| **Opal** | `#6850AD` | `104, 80, 173` | `73, 74, 0, 0` | **Secondary / Mystical Accent:** Huy hiệu phụ, thẻ thống kê, bộ lọc trạng thái, nút hành động phụ. |
| **Blood Bargain** | `#6B0733` | `107, 7, 51` | `34, 100, 42, 52` | **Surface / Card Background:** Nền của các thẻ nhiệm vụ (Quest Card), thẻ vật phẩm Shop, dòng nổi bật của người chơi trên BXH. |
| **Thorn Crown** | `#2D1036` | `45, 16, 54` | `88, 100, 40, 57` | **Main Background:** Nền chính toàn trang, nền ô nhập liệu (Input), nền thanh điều hướng. |

### 2.2. Màu bổ trợ hệ thống (Extended Tokens)
- **Thorn Dark (`#1D0924`):** Nền sâu cho Modal, khung chứa thanh EXP, Scrollbar track.
- **Parchment (`#FFF5EE`):** Màu chữ chính (Trắng kem ánh cam nhẹ giúp dịu mắt trên nền tối `#2D1036`).
- **Fae Light (`#EB9275`):** Màu chữ phụ khi hover hoặc hiển thị số cộng EXP.
- **Opal Light (`#8770CC`):** Viền phát sáng nhẹ cho các thẻ đặc biệt.

### 2.3. Cấu hình CSS Variables & Tailwind (`tailwind.config.ts`)
```typescript
// Copy đoạn này vào tailwind.config.ts trên Antigravity
colors: {
  thorn: {
    DEFAULT: '#2D1036', // Thorn Crown
    dark: '#1D0924',
    light: '#3E174B',
  },
  bargain: {
    DEFAULT: '#6B0733', // Blood Bargain
    dark: '#4D0424',
    light: '#8A0B43',
  },
  opal: {
    DEFAULT: '#6850AD', // Opal
    dark: '#4E3A87',
    light: '#8770CC',
  },
  fae: {
    DEFAULT: '#D97352', // Fae Fruit
    dark: '#B85A3B',
    light: '#EB9275',
  },
  parchment: '#FFF5EE',
}
```

---

## 3. ĐẶC TẢ CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 3.1. Phân hệ Quản lý Nhiệm vụ Hằng ngày (Daily Quests Module)
- **FR-01 (Thêm nhiệm vụ):** Người dùng nhập tên hoạt động, chọn **Phân loại** và chọn **Độ khó**.
- **FR-02 (Hệ thống Phân loại):**
  1. `hoc-tap`: Học tập (Icon Sách)
  2. `cong-viec`: Công việc (Icon Cặp táp)
  3. `the-luc`: Thể lực (Icon Tạ)
  4. `ca-nhan`: Cá nhân (Icon Trái tim)
  5. `sang-tao`: Sáng tạo & Nghệ thuật (Icon Cọ vẽ)
- **FR-03 (Hệ thống Độ khó & Quy đổi điểm thưởng):**
  - **Khởi Động (Dễ):** `+30 EXP`, `+2 Xu` (Việc nhỏ dưới 15 phút).
  - **Tiêu Chuẩn (Vừa):** `+60 EXP`, `+5 Xu` (Hoạt động 30 - 60 phút).
  - **Thử Thách (Khó):** `+110 EXP`, `+10 Xu` (Đòi hỏi tập trung sâu).
  - **Trùm Cuối Ngày (Sử Thi / Boss):** `+200 EXP`, `+20 Xu` (Mục tiêu đột phá lớn nhất trong ngày).
- **FR-04 (Hoàn thành & Hoàn tác):**
  - Khi tích chọn hoàn thành: Phát âm thanh RPG, hiển thị hiệu ứng chữ bay (`Floating Text: +EXP, +Xu`) ngay tại vị trí con trỏ, cộng điểm vào tổng EXP và Xu.
  - Khi bỏ tích (Hoàn tác): Trừ lại số EXP và Xu tương ứng.
- **FR-05 (Nâng cấp mới - Chuỗi Ngày Liên Tiếp / Streak & Nhiệm vụ Lặp lại):**
  - Cho phép đánh dấu nhiệm vụ là "Lặp lại hằng ngày" (Daily Reset) để tự động làm mới vào ngày hôm sau.

### 3.2. Phân hệ Thăng Cấp 7 Bậc Rank (7-Tier Rank Progression Engine)
- **FR-06 (Quy tắc tính Rank):** Tổng điểm EXP quyết định Bậc Rank hiện tại của người chơi theo bảng dưới đây:

| STT | Mã Rank | Tên Bậc Rank | Ngưỡng EXP Yêu Cầu | Thưởng Xu Khi Thăng Hạng | Danh Hiệu / Mô Tả |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `dong` | **Đồng** | `0 - 199 EXP` | `0 Xu` (Mặc định) | Khởi đầu hành trình rèn luyện kỷ luật bản thân. |
| 2 | `bac` | **Bạc** | `200 - 499 EXP` | `+50 Xu` | Lưỡi kiếm đã bén, thói quen tốt bắt đầu hình thành. |
| 3 | `vang` | **Vàng** | `500 - 999 EXP` | `+100 Xu` | Ánh hào quang rực rỡ của sự kiên trì mỗi ngày. |
| 4 | `luc-bao` | **Lục Bảo** | `1000 - 1799 EXP` | `+160 Xu` | Sức sống mãnh liệt, năng suất vượt trội hơn số đông. |
| 5 | `cao-thu` | **Cao Thủ** | `1800 - 2799 EXP` | `+250 Xu` | Làm chủ thời gian, ngọn lửa Opal huyền bí thức tỉnh. |
| 6 | `dai-cao-thu`| **Đại Cao Thủ**| `2800 - 3999 EXP` | `+400 Xu` | Huyết ước tối thượng! Không mục tiêu nào cản bước. |
| 7 | `thach-dau` | **Thách Đấu** | `4000+ EXP` | `+700 Xu` | Đỉnh cao huyền thoại! Chuẩn mực của kỷ luật tuyệt đối. |

- **FR-07 (Sự kiện Thăng Hạng - Rank Up Event):**
  - Ngay khi tổng EXP vượt ngưỡng sang bậc Rank mới, hệ thống kích hoạt **Modal Chúc Mừng Thăng Hạng** kèm huy hiệu SVG độc quyền của Rank mới, cộng thẳng số **Xu Thưởng Thăng Hạng** vào ví của người chơi.

### 3.3. Phân hệ Cửa Hàng Tự Thưởng & Kho Vé (Reward Shop & Inventory)
- **FR-08 (Danh mục Vật phẩm Tự thưởng):**
  - Cung cấp sẵn các phần thưởng mẫu tăng dần theo giá trị:
    - *Ăn một món yêu thích (10 Xu)*
    - *Uống Trà sữa / Cà phê ngon (15 Xu)*
    - *Chơi Game giải trí 1 tiếng (25 Xu)*
    - *Xem 1 bộ phim chiếu rạp / Anime (50 Xu)*
    - *Chốt đơn 1 món đồ trong giỏ hàng (120 Xu)*
    - *Ngày Nghỉ Xả Hơi - Cheat Day (250 Xu)*
- **FR-09 (Tự tạo Phần thưởng cá nhân):** Người dùng có thể tự thêm món quà mới với Tên, Mô tả, Biểu tượng Emoji và Giá Xu tùy chọn.
- **FR-10 (Kho Vé Thưởng - Inventory):** Khi mua vật phẩm trong Shop, Xu bị trừ và vật phẩm chuyển vào **Kho Phần Thưởng** dưới dạng "Vé Chưa Sử Dụng". Khi người dùng thực hiện phần thưởng ngoài đời thực, nhấn **"Sử dụng ngay"** để đánh dấu hoàn tất.

### 3.4. Phân hệ Bảng Xếp Hạng Đối Thủ Ảo (Simulated Rivals Leaderboard)
- **FR-11 (Danh sách Đối thủ giả lập):** Tạo sẵn 7 đối thủ rải đều ở 7 bậc Rank từ Đồng đến Thách Đấu.
- **FR-12 (Banner Mục tiêu Bứt phá):** Tự động tính toán và hiển thị thông báo: *"Bạn chỉ cần thêm X EXP nữa để vượt qua [Tên Đối Thủ] và chiếm vị trí Hạng #Y!"*.
- **FR-13 (Mô phỏng Hoạt động của Đối thủ):** Nút **"Cập nhật hoạt động đối thủ"** (hoặc tự động cộng ngẫu nhiên `10 - 50 EXP` mỗi ngày cho các đối thủ) để tạo áp lực cạnh tranh lành mạnh. Cho phép người dùng tự thêm đối thủ mới (ví dụ tên bạn bè để tự thi đua).

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT ARCHITECTURE)
Khi xây dựng trên Antigravity bằng React / Next.js, hãy tổ chức theo cấu trúc sạch sẽ, dễ bảo trì sau:

```text
faequest-rpg-todo/
├── public/
├── src/
│   ├── app/                        # Next.js App Router (hoặc main entry)
│   │   ├── globals.css             # Khai báo biến màu, hiệu ứng nổi, custom scrollbar
│   │   ├── layout.tsx              # Font Cinzel + Plus Jakarta Sans
│   │   └── page.tsx                # Trang Dashboard chính
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBanner.tsx       # Header nghệ thuật + Bảng màu + Nút Âm thanh
│   │   │   └── NavigationTabs.tsx  # 4 Tab: Nhiệm Vụ, Cửa Hàng, BXH, Kho Đồ
│   │   ├── hero/
│   │   │   ├── PlayerStatusCard.tsx# Hiển thị Rank hiện tại, Thanh EXP, Ví Xu
│   │   │   ├── RankEmblemSvg.tsx   # Bộ 7 SVG Huy hiệu Rank (Đồng -> Thách Đấu)
│   │   │   └── RankProgressionStrip.tsx # Thanh 7 bậc tiến trình thu nhỏ
│   │   ├── quests/
│   │   │   ├── AddQuestForm.tsx    # Form thêm task + Chọn phân loại + Độ khó
│   │   │   ├── QuestFilterBar.tsx  # Bộ lọc theo danh mục & trạng thái
│   │   │   └── QuestList.tsx       # Danh sách task + Hiệu ứng +EXP bay lên
│   │   ├── shop/
│   │   │   ├── RewardShopGrid.tsx  # Lưới vật phẩm tự thưởng + Nút mua
│   │   │   ├── AddShopItemModal.tsx# Modal tự thêm phần thưởng mới
│   │   │   └── InventoryList.tsx   # Kho vé thưởng đã mua & lịch sử dùng
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.tsx# Bảng xếp hạng người chơi + AI Rivals
│   │   │   ├── RivalTargetBanner.tsx# Banner báo số EXP cần để vượt đối thủ kế tiếp
│   │   │   └── AddRivalModal.tsx   # Modal thêm đối thủ cạnh tranh mới
│   │   └── modals/
│   │       ├── RankUpModal.tsx     # Modal ăn mừng khi thăng hạng + Nhận thưởng Xu
│   │       └── RankRoadmapModal.tsx# Modal xem chi tiết 7 bậc Rank
│   ├── constants/
│   │   ├── ranks.ts                # Cấu hình 7 bậc Rank, ngưỡng EXP, thưởng Xu
│   │   ├── categories.ts           # 5 phân loại & 4 độ khó nhiệm vụ
│   │   └── initialData.ts          # Dữ liệu mẫu cho Tasks, Shop, Rivals
│   ├── store/
│   │   └── useFaeQuestStore.ts     # Zustand Store xử lý toàn bộ logic EXP, Rank, Xu
│   ├── types/
│   │   └── index.ts                # TypeScript Interfaces (Task, RankTier, ShopItem, Rival)
│   └── utils/
│       └── soundEffects.ts         # Web Audio API tạo âm thanh RPG
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## 5. DATA MODELS (TYPESCRIPT INTERFACES)
Bạn có thể cung cấp sẵn đoạn TypeScript này cho Antigravity để đảm bảo cấu trúc dữ liệu chặt chẽ:

```typescript
export type TaskCategory = 'hoc-tap' | 'cong-viec' | 'the-luc' | 'ca-nhan' | 'sang-tao';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'boss';
export type RankId = 'dong' | 'bac' | 'vang' | 'luc-bao' | 'cao-thu' | 'dai-cao-thu' | 'thach-dau';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  completed: boolean;
  isDailyRecurring?: boolean;
  createdAt: number;
}

export interface RankTier {
  id: RankId;
  name: string;
  minExp: number;
  maxExp: number;
  coinBonus: number;
  quote: string;
}

export interface ShopItem {
  id: string;
  title: string;
  desc: string;
  cost: number;
  emoji: string;
}

export interface InventoryTicket {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  redeemedAt: string;
  used: boolean;
}

export interface Rival {
  id: string;
  name: string;
  title: string;
  exp: number;
  avatar: string;
}
```

---

## 6. BỘ MASTER PROMPT ĐỂ COPY VÀO ANTIGRAVITY

### 6.1. Prompt Khởi Tạo Toàn Bộ Dự Án (Initial Build Prompt)
> **Hướng dẫn:** Hãy copy toàn bộ nội dung trong khung dưới đây và dán vào khung chat của **Antigravity** để AI tự động thiết lập cấu trúc dự án và viết code hoàn chỉnh.

```markdown
Hãy đóng vai một Senior Full-Stack Product Engineer và UI/UX Designer chuyên thiết kế ứng dụng Gamification RPG. Tôi muốn bạn xây dựng ứng dụng web mang tên **FaeQuest — Hệ Thống Todo List Nhập Vai (RPG Productivity App)** bằng React + TypeScript + Tailwind CSS + Lucide/Phosphor Icons + Framer Motion.

### 1. YÊU CẦU BẢNG MÀU BẮT BUỘC (STRICT COLOR PALETTE)
Toàn bộ giao diện phải sử dụng bảng màu Dark Fantasy RPG từ bộ "Palette for Illustration #7":
- **Thorn Crown (`#2D1036`, RGB: 45, 16, 54)**: Màu nền chính toàn trang (Main Background), kết hợp với `#1D0924` cho phần nền sâu.
- **Blood Bargain (`#6B0733`, RGB: 107, 7, 51)**: Màu nền của các thẻ Card (Quest Cards, Shop Cards, Player Hero Card) kết hợp hiệu ứng kính mờ (Glassmorphism) và gradient về `#2D1036`.
- **Opal (`#6850AD`, RGB: 104, 80, 173)**: Màu nhấn phụ (Secondary Accent), dùng cho các huy hiệu, viền phát sáng, tab phụ và thanh tiến trình.
- **Fae Fruit (`#D97352`, RGB: 217, 119, 82)**: Màu nhấn chính (Primary CTA, Highlights, EXP Bar, Coin Currency, Rank Up Borders).
- **Chữ chính (Text Primary)**: Màu kem sáng `#FFF5EE` (Parchment) để đảm bảo độ tương phản cao và dễ đọc trên nền tối.

### 2. CÁC CHỨC NĂNG CỐT LÕI CẦN XÂY DỰNG
1. **Quản lý Nhiệm Vụ Hằng Ngày (Daily Quests)**:
   - Cho phép thêm nhiệm vụ mới với: Tên nhiệm vụ, Phân loại (`Học tập`, `Công việc`, `Thể lực`, `Cá nhân`, `Sáng tạo`) và Độ khó (`Dễ: +30 EXP / +2 Xu`, `Vừa: +60 EXP / +5 Xu`, `Khó: +110 EXP / +10 Xu`, `Trùm Cuối Ngày: +200 EXP / +20 Xu`).
   - Có bộ lọc theo Phân loại và Trạng thái (`Tất cả`, `Chưa xong`, `Đã xong`).
   - Khi tích hoàn thành nhiệm vụ: Phát âm thanh RPG bằng Web Audio API, hiển thị hiệu ứng "+EXP & +Xu" bay lên tại vị trí chuột, cộng EXP và Xu vào hồ sơ người chơi.

2. **Hệ Thống 7 Bậc Rank & Huy Hiệu Độc Quyền**:
   - Gồm 7 bậc:
     1. **Đồng** (0 - 199 EXP, thưởng lên cấp: 0 Xu)
     2. **Bạc** (200 - 499 EXP, thưởng lên cấp: +50 Xu)
     3. **Vàng** (500 - 999 EXP, thưởng lên cấp: +100 Xu)
     4. **Lục Bảo** (1000 - 1799 EXP, thưởng lên cấp: +160 Xu)
     5. **Cao Thủ** (1800 - 2799 EXP, thưởng lên cấp: +250 Xu)
     6. **Đại Cao Thủ** (2800 - 3999 EXP, thưởng lên cấp: +400 Xu)
     7. **Thách Đấu** (4000+ EXP, thưởng lên cấp: +700 Xu)
   - Thiết kế 7 biểu tượng SVG huy hiệu riêng biệt cho từng bậc Rank.
   - Hiển thị Hero Card trên cùng gồm: Tên người chơi (cho phép đổi tên), Huy hiệu Rank hiện tại, Thanh tiến trình EXP mượt mà, Số EXP còn thiếu để lên bậc tiếp theo, Tổng số Xu hiện có, và Dải lộ trình 7 bậc Rank.
   - Khi người chơi hoàn thành task và đủ EXP vượt qua mốc Rank mới: Mở ngay **Modal Chúc Mừng Thăng Hạng (Rank Up Celebration)** và cộng số Xu thưởng thăng hạng vào tài khoản.

3. **Cửa Hàng Tự Thưởng (Reward Shop) & Kho Phần Thưởng (Inventory)**:
   - Người chơi dùng Xu tích lũy được để mua các phần thưởng tự thưởng bản thân ngoài đời thực (VD: Ăn món yêu thích 10 Xu, Uống trà sữa 15 Xu, Chơi game 1 tiếng 25 Xu, Xem phim 50 Xu, Mua đồ yêu thích 120 Xu, Nghỉ xả hơi 250 Xu).
   - Cho phép người chơi tự tạo thêm vật phẩm mới vào Cửa hàng (Tên, Mô tả, Emoji, Giá Xu).
   - Khi mua xong, vật phẩm chuyển vào tab **Kho Phần Thưởng** dưới dạng vé thưởng để người chơi bấm "Sử dụng ngay" khi thực hiện ngoài đời.

4. **Bảng Xếp Hạng Đối Thủ Ảo (Simulated Rivals Leaderboard)**:
   - Tạo sẵn 7 đối thủ giả lập ở các mức EXP khác nhau từ Đồng đến Thách Đấu.
   - Hiển thị vị trí xếp hạng hiện tại của người chơi so với các đối thủ.
   - Có Banner chỉ rõ: "Bạn chỉ cần thêm X EXP nữa để vượt qua đối thủ [Tên] phía trước!".
   - Có nút "Cập nhật hoạt động đối thủ" (cộng ngẫu nhiên 10-50 EXP cho các đối thủ) và nút "Thêm đối thủ mới" để tăng tính cạnh tranh.

5. **Lưu trữ & Trải nghiệm**:
   - Tự động lưu toàn bộ dữ liệu vào `localStorage`.
   - Có nút "+150 EXP Thử Nghiệm" trên thanh Header để dễ dàng kiểm thử tính năng lên Rank và nhận Xu.
```

---

### 6.2. Prompt Nâng Cấp Giai Đoạn 2 (Phase 2 Upgrade Prompt cho Antigravity)
Sau khi Antigravity đã tạo xong bản chạy ổn định ở Bước 1, bạn có thể dùng tiếp Prompt dưới đây để nâng cấp thêm các tính năng nâng cao:

```markdown
Hãy nâng cấp ứng dụng FaeQuest hiện tại với 4 tính năng nâng cao sau mà vẫn giữ nguyên bảng màu (`#2D1036`, `#6B0733`, `#6850AD`, `#D97352`):
1. **Chuỗi Ngày Kỷ Luật (Daily Streak & Combo Bonus)**: Theo dõi số ngày liên tiếp người chơi hoàn thành ít nhất 1 nhiệm vụ. Nếu đạt chuỗi từ 3 ngày trở lên, cộng thêm 20% Bonus EXP cho mỗi nhiệm vụ hoàn thành.
2. **Đồng Hồ Tập Trung Pomodoro (Fae Focus Timer)**: Tích hợp một đồng hồ đếm ngược 25 phút ngay trong mỗi nhiệm vụ. Khi người chơi bật Pomodoro và hoàn thành phiên tập trung cho nhiệm vụ đó, thưởng thêm +10 Xu.
3. **Biểu Đồ Thống Kê Năng Suất (Productivity Analytics)**: Thêm một khu vực biểu đồ hiển thị tỷ lệ phần trăm các nhóm hoạt động đã làm (Học tập, Công việc, Thể lực, Cá nhân, Sáng tạo) và lượng EXP kiếm được trong 7 ngày gần nhất.
4. **Nhiệm Vụ Định Kỳ (Daily Reset)**: Cho phép đánh dấu các thói quen hằng ngày để hệ thống tự động làm mới trạng thái "Chưa hoàn thành" khi bước sang ngày mới mà không làm mất lịch sử EXP đã tích lũy.
```