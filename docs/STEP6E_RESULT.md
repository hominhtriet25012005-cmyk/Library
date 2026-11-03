# 6E — Kết quả quên mật khẩu / đặt lại mật khẩu

Cập nhật 05/10/2026, Asia/Saigon. Phạm vi là hai endpoint Backend hiện có; chưa triển khai giao diện.

## Đã sửa

| File | Thay đổi |
|---|---|
| `Library/src/main/java/com/library/payload/request/ForgotPasswordRequest.java` | Email bắt buộc, đúng định dạng, tối đa 255 ký tự |
| `Library/src/main/java/com/library/payload/request/ResetPasswordRequest.java` | Token/password bắt buộc; token tối đa 255 ký tự theo schema |
| `Library/src/main/java/com/library/controller/AuthController.java` | Bật `@Valid`; phản hồi forgot-password không tiết lộ email có tồn tại hay không |
| `Library/src/main/java/com/library/service/impl/AuthServiceImpl.java` | Link `/reset-password?token=...`; URL frontend cấu hình qua `app.frontend-url`, mặc định localhost:5173; email không tồn tại trả cùng luồng thành công nhưng không phát token/mail; tạo token và gửi mail trong transaction; reset khóa token, kiểm tra hạn, lưu password hash và xóa token trong cùng transaction |
| `Library/src/main/java/com/library/repository/PasswordResetTokenRepository.java` | Truy vấn `PESSIMISTIC_WRITE` để tuần tự hóa yêu cầu dùng cùng token |
| `Library/src/main/java/com/library/modal/PasswordResetToken.java` | Token hết hạn khi expiry bằng/trước hiện tại; expiry null được coi là hết hạn |
| `Library/src/test/java/com/library/Step6ApiMySqlIT.java` | Kiểm tra link, email không tồn tại, validation, token dùng lại và password cũ |

Giữ thời hạn token 5 phút, schema và policy password hiện hữu ngoài việc từ chối giá trị rỗng. Email được mock; không gửi thư thật.

## Kiểm chứng

- `clean compile test`: **8/8 ca API MySQL 6E đạt**; `library_db1`, Hibernate validate, safety guard yêu cầu bảng rỗng, transaction rollback.
- `package`: **80/80 regression test đạt**, `BUILD SUCCESS`; `Step6ApiMySqlIT` chạy riêng, không nằm trong lượt package.
- JDBC read-only cuối: `library_db1`, 12 bảng đều 0 dòng.
- Không ALTER schema, không gửi email thật. Diff whitespace sạch.
- Executable JAR tại `Library/target/Library-0.0.1-SNAPSHOT.jar`, SHA-256 `14B5D36C6B2E5DF34D6C99527F981AACE2FBEE7CA96705166582D1AA2D7A22D2`.
- Chưa chạy JAR trực tiếp hoặc xác minh SMTP delivery.

## Giới hạn còn mở

- Chưa thử racing request đã commit trên MySQL; pessimistic lock có trong repository nhưng concurrency thật thuộc 6G/6H.
- Nhiều token hợp lệ của cùng user có thể tồn tại đến khi hết hạn; tài liệu chưa quy định chỉ token mới nhất được dùng.
- Chưa có rate limit hoặc dọn token hết hạn tự động; tài liệu không yêu cầu scheduler.

Không sửa dữ liệu hiện có trong 6E.
