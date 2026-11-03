# BE-4 — Tài khoản và sách

Ngày triển khai code: 02/11/2026  
Trạng thái: Đã triển khai, chờ kiểm thử

## Phạm vi đã thực hiện

### Tài khoản

- Đăng ký và đặt lại mật khẩu yêu cầu từ 8 đến 72 ký tự.
- Thông báo validation hiển thị bằng tiếng Việt.
- `UserDTO.password` là dữ liệu chỉ nhận vào và không được serialize ra JSON.
- `GET /api/users/profile` trả `UserDTO` thay vì trả trực tiếp entity `User`.
- Khi tạo token đặt lại mật khẩu mới, Backend khóa bản ghi người dùng, xóa token reset cũ và lưu token mới trong cùng transaction.
- Email không tồn tại vẫn nhận phản hồi chung như trước để tránh tiết lộ tài khoản.

### Sách

- `createBooksBulk` dùng một transaction cho toàn bộ danh sách.
- Nếu một sách trong lô không hợp lệ hoặc trùng ISBN, toàn bộ thay đổi của lô được rollback.
- ISBN tiếp tục là trường không bắt buộc và không có thay đổi schema.

## Ngoài phạm vi V1

- Sửa hồ sơ.
- Đổi mật khẩu khi đang đăng nhập.
- Rate limit phân tán cho chức năng quên mật khẩu.

Các mục này cần chốt nghiệp vụ hoặc hạ tầng trước khi triển khai.

## Database

Không ALTER schema và không sửa `library_db1.sql`. Việc vô hiệu token cũ sử dụng thao tác xóa theo `user_id` trên bảng hiện có.

## Kiểm chứng trong lượt triển khai

- `git diff --check`: đạt.
- `mvnw -DskipTests package`: BUILD SUCCESS; biên dịch 151 main source và 51 test source.
- Không chạy test.
- Không ghi dữ liệu MySQL.

Do chưa chạy test và chưa nghiệm thu runtime/MySQL, BE-4 chưa được đánh dấu hoàn tất nghiệm thu.
