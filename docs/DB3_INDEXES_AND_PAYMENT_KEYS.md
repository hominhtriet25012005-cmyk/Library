# DB-3 — Unique key thanh toán và composite index

Ngày triển khai: 31/10/2026.

## 1. Phạm vi

DB-3 đồng bộ file schema chính `database/library_db1.sql`, MySQL `library_db1` và Backend theo các quyết định sau:

- hệ thống chỉ dùng `PAYOS`; enum Java và `chk_payments_gateway` không còn nhận gateway cũ;
- `payments.transaction_id` và `payments.gateway_order_id` là unique khi có giá trị; MySQL vẫn cho phép nhiều `NULL`;
- thêm index tổng hợp dựa trên các truy vấn thực tế trong repository, không thêm index phỏng đoán;
- cập nhật module Payment trong tài liệu gốc sang payOS/VietQR/VND.

## 2. Tiền kiểm và sao lưu

Kết quả đọc trước ALTER trên database thật:

- payment theo gateway: `PAYOS = 1`, gateway khác = `0`;
- nhóm `transaction_id` trùng = `0`, giá trị rỗng = `0`;
- nhóm `gateway_order_id` trùng = `0`, giá trị rỗng = `0`.

Bản sao lưu trước DDL:

- file: `database/backups/library_db1_db3_20261031_101726.sql`;
- kích thước: `59063` byte;
- SHA-256: `B19BD9CEAA0385409BB02B56D3B3B5D9CBEB4C1C5117DD9B55968EEF18E300B4`.

File schema chính đã được dựng thử thành công trên database tạm `library_db1_db3_verify`. Chuỗi ALTER dành cho database hiện hữu cũng được diễn tập trên clone schema tạm trước khi áp dụng thật.

## 3. Unique key và CHECK thanh toán

| Tên | Cột / quy tắc | Mục đích |
| --- | --- | --- |
| `chk_payments_gateway` | `gateway = 'PAYOS'` | Java và MySQL cùng chỉ chấp nhận payOS |
| `uq_payments_transaction_id` | `transaction_id` | Ngăn một mã giao dịch gắn nhiều payment |
| `uq_payments_gateway_order_id` | `gateway_order_id` | Ngăn một order code payOS gắn nhiều payment |

## 4. Composite index

| Bảng | Index | Cột theo thứ tự | Truy vấn phục vụ |
| --- | --- | --- | --- |
| `payments` | `idx_payments_fine_gateway_id` | `fine_id, gateway, id` | payment mới nhất theo Fine/payOS |
| `payments` | `idx_payments_subscription_gateway_id` | `subscription_id, gateway, id` | payment mới nhất theo Subscription/payOS |
| `subscriptions` | `idx_subscriptions_user_active_period` | `user_id, is_active, start_date, end_date` | tìm/kiểm tra gói active của USER |
| `subscriptions` | `idx_subscriptions_active_end_date` | `is_active, end_date` | quét gói active đã hết hạn |
| `book_loans` | `idx_book_loans_user_status` | `user_id, status` | đếm/lọc lượt mượn active theo USER |
| `book_loans` | `idx_book_loans_book_status` | `book_id, status` | kiểm tra sách đang được mượn |
| `book_loans` | `idx_book_loans_status_due_id` | `status, due_date, id` | batch quá hạn |
| `reservations` | `idx_reservations_book_status_queue` | `book_id, status, reserved_at, id` | hàng chờ đặt giữ theo sách |
| `reservations` | `idx_reservations_user_book_status` | `user_id, book_id, status` | chặn đặt giữ trùng và đếm theo USER |
| `fines` | `idx_fines_user_status_type_created` | `user_id, status, type, created_at` | lọc tiền phạt theo USER/trạng thái/loại |
| `book_reviews` | `idx_book_reviews_book_active_created` | `book_id, is_active, created_at` | danh sách đánh giá đang hiển thị theo sách |

Các index đơn do FK tạo tự động được MySQL loại khi index tổng hợp mới có cùng cột đầu và đủ điều kiện bảo vệ FK. Các FK vẫn còn nguyên và được Hibernate/MySQL xác nhận.

## 5. Ghi chú triển khai

MySQL tự commit DDL. Sau khi các ALTER chính hoàn tất, câu lệnh dọn `fk_payments_fine` trả `1091` vì MySQL thật đã tự loại index dư đó. Không có rollback hay chạy lại mù quáng; metadata được đọc lại và xác nhận toàn bộ CHECK, unique key, composite index và FK ở trạng thái mong muốn.

## 6. Kiểm chứng

- dựng mới file `database/library_db1.sql` trên database tạm: đạt;
- diễn tập ALTER trên clone schema hiện hữu: đạt;
- `CatalogMappingIT + PaymentSchemaContractIT + ReviewTokenMappingIT + SubscriptionPaymentMappingIT`: `9/9` đạt, bao gồm Hibernate `validate` với MySQL 9.2;
- nhóm PayOS/VND/routing/repository không phụ thuộc H2: `20/20` đạt;
- compile Backend: đạt.

`PayOSAtomicityTests` cũng được chạy thử nhưng chưa thể dùng làm bằng chứng DB-3: H2 không tạo được bảng `books` vì entity đang dùng kiểu MySQL `SMALLINT UNSIGNED` cho `publication_year`, kéo theo `2` failure và `9` error. Đây là lỗi nền H2 đã được ghi nhận từ DB-1, không phải lỗi enum, CHECK, unique key hoặc index DB-3.

## 7. Kết luận

DB-3 hoàn tất khi các điều kiện sau cùng đạt:

- file schema nguồn dựng mới thành công;
- database thật chỉ nhận gateway `PAYOS`;
- unique key và 11 composite index hiện diện đúng thứ tự cột;
- Hibernate `ddl-auto=validate`, contract test MySQL và nhóm hồi quy tập trung `20/20` đều đạt.
