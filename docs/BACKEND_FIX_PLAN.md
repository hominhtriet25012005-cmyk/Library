# Kế hoạch sửa Backend theo giai đoạn

Database chính: `library_db1`. Không xóa dữ liệu, không tự sửa schema.

1. Compile và DI: sửa tên DTO, biến/import sai, thống nhất kiểu role, inject dependency, tách tên bean sự kiện. Kiểm chứng bằng Maven clean compile và test không kết nối DB.
2. Mapping và cấu hình: map tên bảng/cột/FK/enum/ID theo MySQL hiện có; dùng ddl-auto=validate; kiểm soát initializer. Không dùng Hibernate update để tạo bảng/cột. Build lại và kiểm tra metadata.
3. Từng luồng: auth/user, catalog, loan/reservation, subscription/payment/fine. Kiểm thử riêng từng nhóm; không thay đổi quy tắc nghiệp vụ chưa được xác định.
4. Runtime và API: chỉ chạy sau khi schema và mapping đủ điều kiện; kiểm thử ghi với dữ liệu thử được kiểm soát, không xóa dữ liệu có sẵn. Review lại toàn bộ thay đổi.

## Điểm cần quyết định trước khi sửa schema

- Database thiếu bảng BookReview và PasswordResetToken; cần bổ sung nơi lưu để giữ chức năng hiện tại.
- subscription_plans dùng title/duration_in_days/active/DECIMAL, thiếu mã gói và hạn mức mượn đang được Backend sử dụng. Không suy diễn max_users_allowed thành max_books_allowed.
- CHECK payments.status không nhận PROCESSING/REFUNDED. Cần giữ đúng quy tắc trạng thái được thống nhất.

## Tiến độ

- Review hoàn thành trong chat; xác minh database thực tế và compile thất bại.
- Giai đoạn 1 đang triển khai.
