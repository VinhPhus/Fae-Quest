import { Task, ShopItem, InventoryTicket, Rival } from '../types';

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Hoàn thành bài tập / dự án quan trọng nhất trong ngày',
    category: 'cong-viec',
    difficulty: 'hard',
    completed: false,
    isDailyRecurring: true,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 't2',
    title: 'Đọc 20 trang sách chuyên ngành hoặc ngoại ngữ',
    category: 'hoc-tap',
    difficulty: 'medium',
    completed: false,
    isDailyRecurring: true,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 't3',
    title: 'Tập thể dục / chạy bộ 30 phút rèn luyện thể lực',
    category: 'the-luc',
    difficulty: 'medium',
    completed: false,
    isDailyRecurring: true,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 't4',
    title: 'Uống đủ 2 lít nước & dọn góc làm việc sạch sẽ',
    category: 'ca-nhan',
    difficulty: 'easy',
    completed: true,
    isDailyRecurring: true,
    createdAt: Date.now() - 3600000 * 5,
    completedAt: Date.now() - 3600000 * 1,
  },
  {
    id: 't5',
    title: 'Chiến dịch Trùm Cuối: Tập trung Deep Work 2 tiếng không lướt mạng xã hội',
    category: 'sang-tao',
    difficulty: 'boss',
    completed: false,
    isDailyRecurring: false,
    createdAt: Date.now() - 3600000 * 1,
  },
];

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 's1',
    title: 'Ăn một món yêu thích',
    desc: 'Tự thưởng món ngon ấm bụng sau giờ làm việc chăm chỉ',
    cost: 10,
    emoji: '🍜',
  },
  {
    id: 's2',
    title: 'Thưởng thức Trà sữa / Cà phê ngon',
    desc: 'Một ly đồ uống nạp lại năng lượng tích cực',
    cost: 15,
    emoji: '🧋',
  },
  {
    id: 's3',
    title: 'Chơi Game giải trí 1 tiếng',
    desc: 'Thoải mái chiến game yêu thích không lo nghĩ',
    cost: 25,
    emoji: '🎮',
  },
  {
    id: 's4',
    title: 'Xem 1 bộ phim chiếu rạp / Anime',
    desc: 'Thư giãn tâm trí với bộ phim đang mong đợi',
    cost: 50,
    emoji: '🎬',
  },
  {
    id: 's5',
    title: 'Chốt đơn 1 món đồ trong giỏ hàng',
    desc: 'Mua món phụ kiện hoặc cuốn sách bạn thích bấy lâu',
    cost: 120,
    emoji: '🛍️',
  },
  {
    id: 's6',
    title: 'Ngày Nghỉ Xả Hơi (Cheat Day)',
    desc: 'Một ngày nghỉ ngơi trọn vẹn sau chuỗi ngày cày Rank',
    cost: 250,
    emoji: '🏖️',
  },
];

export const INITIAL_INVENTORY: InventoryTicket[] = [
  {
    id: 'inv1',
    title: 'Ăn một món yêu thích',
    emoji: '🍜',
    cost: 10,
    redeemedAt: 'Hôm qua',
    used: false,
  },
];

export const INITIAL_RIVALS: Rival[] = [
  { id: 'r1', name: 'Linh Nhi', title: 'Tân Binh Gai Đỏ', exp: 160, avatar: '🦊' },
  { id: 'r2', name: 'Hoàng Phúc', title: 'Kẻ Chế Ngự Thời Gian', exp: 310, avatar: '🐺' },
  { id: 'r3', name: 'Minh Khôi', title: 'Thể Phách Kim Cương', exp: 640, avatar: '🦁' },
  { id: 'r4', name: 'Bảo Ngọc', title: 'Học Giả Huyền Bí', exp: 1250, avatar: '🦄' },
  { id: 'r5', name: 'Tuấn Kiệt', title: 'Chiến Binh Bất Khuất', exp: 2150, avatar: '🐉' },
  { id: 'r6', name: 'Huyền Trang', title: 'Hiền Nhân Tập Trung', exp: 3100, avatar: '🦅' },
  { id: 'r7', name: 'Ares Vũ', title: 'Độc Cô Cầu Bại', exp: 4350, avatar: '👑' },
];
