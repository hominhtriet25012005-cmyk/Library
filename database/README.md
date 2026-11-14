# Database

## File chính

`library_db1.sql` là **nguồn schema MySQL duy nhất được sử dụng** để tạo database của project.

- Không dùng Flyway hoặc Liquibase.
- Không lưu tài khoản, mật khẩu ADMIN hoặc dữ liệu runtime trong file SQL.
- Các file `b0_*`, `B0*Migration.java`, `SchemaReadOnlyCheck.java` và `stage4_schema_proposal.sql` là công cụ/lịch sử kiểm tra cũ, **không được chạy để dựng database**.
- Thư mục `backups/` chỉ chứa bản sao lưu và bằng chứng lịch sử; không phải schema nguồn.

Khi cần dựng database mới, chạy `library_db1.sql`, sau đó khởi động Backend với `spring.jpa.hibernate.ddl-auto=validate`.

## Khởi tạo ADMIN

ADMIN được tạo bởi Backend khi người vận hành chủ động bật `APP_INITIALIZE_ADMIN=true` và cung cấp biến môi trường. Không thêm hoặc nâng quyền ADMIN bằng SQL.

## Biên bản triển khai

- DB-1 — chuẩn hóa schema và khởi tạo ADMIN: `../docs/DB1_DATABASE_CANONICALIZATION.md`.
- DB-2 — ISBN tùy chọn và CHECK constraint nghiệp vụ: `../docs/DB2_SCHEMA_CONSTRAINTS.md`.
- DB-3 — unique key thanh toán và composite index: `../docs/DB3_INDEXES_AND_PAYMENT_KEYS.md`.
- NT-1 — schema thông báo và email: `../docs/email.md`.

DB-3 đã được áp dụng vào `library_db1` thật ngày 31/10/2026. Gateway thanh toán hiện chỉ còn `PAYOS`; unique key giao dịch và các composite index chính đã đồng bộ với file schema nguồn.

NT-1 đã được thêm vào file schema nguồn ngày 14/11/2026 nhưng chưa áp dụng vào `library_db1` live. Bốn bảng NT-1 là `email_verification_tokens`, `user_notification_preferences`, `notifications` và `email_outbox`.
