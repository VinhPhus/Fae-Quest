# Quy Tắc Phát Triển Dự Án FaeQuest

## An Toàn Quản Lý Phiên Bản (Git & GitHub)
- **Không tự ý `git push`**: Tuyệt đối KHÔNG tự ý thực hiện lệnh `git push` lên GitHub hoặc bất kỳ remote repository nào sau khi sửa mã nguồn hoặc commit.
- **Chỉ push khi có yêu cầu**: Chỉ thực thi lệnh `git push` khi và chỉ khi người dùng đưa ra chỉ thị rõ ràng (ví dụ: *"push lên github giúp tôi"*, *"đẩy code lên git"*).
- Các bước kiểm tra build (`npm run build`) và commit cục bộ (local commit) có thể thực hiện để bảo toàn tiến độ, nhưng việc đẩy lên remote phải chờ lệnh từ người dùng.
