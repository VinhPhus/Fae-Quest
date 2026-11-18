# Quy Tắc Phát Triển Dự Án FaeQuest

## An Toàn Quản Lý Phiên Bản (Git & GitHub)
- **Không tự ý `git push`**: Tuyệt đối KHÔNG tự ý thực hiện lệnh `git push` lên GitHub hoặc bất kỳ remote repository nào sau khi sửa mã nguồn hoặc commit.
- **Chỉ push khi có yêu cầu**: Chỉ thực thi lệnh `git push` khi và chỉ khi người dùng đưa ra chỉ thị rõ ràng (ví dụ: *"push lên github giúp tôi"*, *"đẩy code lên git"*).
- Các bước kiểm tra build (`npm run build`) và commit cục bộ (local commit) có thể thực hiện để bảo toàn tiến độ, nhưng việc đẩy lên remote phải chờ lệnh từ người dùng.

## Đồng Bộ Hướng Dẫn Tân Thủ (Interactive Tour) Khi Cập Nhật UI
- **Luôn rà soát Tour khi sửa UI/Layout**: Bất cứ khi nào thêm, xóa, sửa đổi bố cục, đổi ID/class, hoặc dời vị trí các thành phần giao diện cốt lõi (Top Bar, Sidebar, Bottom Nav, Task Grid, Profile, Shop/Inventory, Modals), BẮT BUỘC phải kiểm tra và cập nhật đồng bộ file `src/utils/onboardingTour.ts` và các ID `#tour-...` tương ứng.
- **Bảo đảm tính toàn vẹn của Target Element**:
  - Không để các selector trong tour bị mồ côi (trỏ vào element không tồn tại).
  - Với các thành phần hiển thị khác nhau giữa Desktop và Mobile (ví dụ: Sidebar Desktop vs Bottom Nav Mobile), phải sử dụng hàm selector động `() => (window.innerWidth >= 768 ? ... : ...)` để tránh lỗi hiển thị khi chuyển đổi kích thước màn hình.
- **Cập nhật kịch bản theo luồng người dùng mới**: Nếu cấu trúc chức năng thay đổi (ví dụ: gộp trang, tách tab, đổi tên tính năng), phải cập nhật lời thoại, tiêu đề và số bước hướng dẫn tương ứng để đảm bảo thông tin luôn chính xác.
