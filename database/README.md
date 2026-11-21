# Cơ sở dữ liệu Library Management System

## File schema chính

[`library_db1.sql`](library_db1.sql) là lược đồ chuẩn để tạo một Database mới cho Project. File hiện định nghĩa **17 bảng**. Tên bảng, cột và mã trạng thái vẫn viết bằng tiếng Anh để khớp với Backend; chú thích giải thích bằng tiếng Việt.

File schema chính mô tả cấu trúc mong muốn, không chứa tài khoản ADMIN, mật khẩu, dữ liệu mượn thực tế hay lệnh nâng cấp dữ liệu của Database đang chạy. `CREATE TABLE IF NOT EXISTS` chỉ tạo bảng còn thiếu; nó **không thêm cột hoặc CHECK còn thiếu vào bảng đã tồn tại**.

## Bắt đầu từ đâu?

- **Tạo Database mới:** dùng `library_db1.sql`, sau đó khởi động Backend với `spring.jpa.hibernate.ddl-auto=validate` để Hibernate đối chiếu cấu trúc.
- **Nâng cấp Database đã có dữ liệu:** không chạy lại toàn bộ file schema như một migration. Đọc [`migrations/README.md`](migrations/README.md), sao lưu và chạy đúng script sau khi đã kiểm tra điều kiện.
- **Tìm ý nghĩa cột:** xem [`DATA_DICTIONARY_VI.md`](DATA_DICTIONARY_VI.md).
- **Xem file SQL/Java cũ:** chúng được lưu trong [`archive/README.md`](archive/README.md) để tra cứu lịch sử, không dùng để tạo hoặc nâng cấp Database hiện tại.
- **Bản sao lưu:** thư mục `backups/` giữ các dump lịch sử; không dùng làm schema nguồn và không đưa vào Git vì có thể chứa dữ liệu runtime.

## Nhóm bảng

| Nhóm | Bảng | Mục đích |
|---|---|---|
| Tài khoản, xác thực và thông báo | `users`, `email_verification_tokens`, `user_notification_preferences`, `notifications`, `email_outbox` | Tài khoản; xác minh email; tùy chọn email; hộp thông báo; hàng đợi gửi email. |
| Danh mục và kho sách | `genres`, `books` | Thể loại và thông tin đầu sách/số lượng bản. |
| Gói thành viên | `subscription_plans`, `subscriptions` | Gói đang mở bán và ảnh chụp quyền lợi/lịch sử đăng ký. |
| Mượn, trả, đặt giữ và tiền phạt | `book_loans`, `fines`, `reservations` | Lượt mượn/check-in, khoản phạt và hàng chờ đặt giữ. |
| Yêu thích và đánh giá | `wishlists`, `book_reviews` | Sách người dùng lưu và đánh giá sao/nhận xét. |
| Đặt lại mật khẩu và thanh toán | `password_reset_tokens`, `payments` | Mã khôi phục mật khẩu và giao dịch payOS. |
| Theo dõi chuyển đổi | `lr_schema_migrations` | Dấu mốc một số lần chuyển đổi dữ liệu/lược đồ đã áp dụng. |

## Đối chiếu MySQL live

Lần đối chiếu chỉ đọc gần nhất được ghi nhận ngày **21/11/2026** trên `library_db1`, MySQL 9.2, cho thấy Database live có đủ **17 bảng** và dữ liệu hiện tại không vi phạm hai quy tắc đang được chuẩn bị cho gói thành viên và mục tiêu thanh toán. Đây là số lượng bảng, không có nghĩa mọi CHECK trong file schema đã được cài vào Database live.

Tại lần đối chiếu đó:

- Dấu mốc `LR1_RESERVED_COPIES` đã có trong `lr_schema_migrations`; không chạy lại migration LR-1 vì script có cập nhật số bản khả dụng.
- Hai migration `20261121_subscription_plan_checks.sql` và `20261121_payment_target_check.sql` mới được chuẩn bị trong Project, **chưa chạy lên MySQL live**. Vì vậy các CHECK tương ứng còn là việc cần xử lý riêng.
- Một số lượt trả lịch sử không có thời điểm check-in. Không tự điền ngày giờ giả vào dữ liệu cũ.
- Không có lệnh DDL hoặc DML nào được chạy lên MySQL live trong lần cập nhật tài liệu này.

Trạng thái live có thể thay đổi sau ngày kiểm tra. Trước khi áp dụng migration, cần sao lưu mới và chạy lại truy vấn tiền kiểm. Chi tiết và cách làm nằm trong [`migrations/README.md`](migrations/README.md).

## Khởi tạo ADMIN

ADMIN được khởi tạo bởi Backend khi người vận hành chủ động bật `APP_INITIALIZE_ADMIN=true` và cấu hình biến môi trường cần thiết. Không thêm tài khoản/mật khẩu ADMIN vào schema SQL và không tự nâng quyền USER bằng SQL.

## Tài liệu theo giai đoạn

- [DB-1 — Chuẩn hóa schema](../docs/DB1_DATABASE_CANONICALIZATION.md)
- [DB-2 — ISBN và CHECK nghiệp vụ](../docs/DB2_SCHEMA_CONSTRAINTS.md)
- [DB-3 — Khóa giao dịch và chỉ mục](../docs/DB3_INDEXES_AND_PAYMENT_KEYS.md)
- [NT — Thông báo và email](../docs/email.md)
- [LR — Mượn và trả sách](../docs/fix-loan-return.md)
- [DB-0 — Baseline lịch sử](../docs/DB0_DATABASE_BASELINE.md)

Các biên bản giai đoạn cũ giữ lại kết quả tại thời điểm lập; khi có khác biệt, dùng schema hiện tại, từ điển và trạng thái live mới nhất ở tài liệu này cùng `migrations/README.md`.
