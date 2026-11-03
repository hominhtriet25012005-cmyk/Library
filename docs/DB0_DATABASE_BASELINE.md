# DB-0 — Baseline và sao lưu Database

Ngày kiểm tra: 30/10/2026  
Database: `library_db1`  
Hệ quản trị: MySQL 9.2.0  
Địa chỉ: `127.0.0.1:3306`

## 1. Phạm vi DB-0

DB-0 chỉ thực hiện các công việc an toàn trước khi chỉnh schema:

- tạo bản sao lưu đầy đủ của database đang chạy;
- đọc và ghi nhận cấu trúc, dữ liệu nền, constraint và index hiện tại;
- chạy các truy vấn kiểm tra dữ liệu có thể xung đột với thay đổi ở DB-1–DB-3;
- không chạy `ALTER`, không thêm/xóa/sửa bản ghi và không thay đổi Backend.

## 2. Bản sao lưu

File backup hợp lệ:

- File: `database/backups/library_db1_db0_20261030_235942.sql`
- Dung lượng: `58.197 bytes`
- SHA-256: `96622A2D18A7B1D6E6D39C3DE8BBBA62513499D51BDED1BF355D1348E10B9554`
- Nội dung: schema, dữ liệu, trigger, routine và event của `library_db1`.
- Số bảng trong dump: `12`.

File dump lỗi có dung lượng `0 byte` phát sinh ở lần thử đầu đã được xóa; thư mục backup chỉ giữ bản hợp lệ nêu trên.

## 3. Hiện trạng schema đang chạy

- Character set: `utf8mb4`
- Collation thực tế: `utf8mb4_0900_ai_ci`
- Storage engine của toàn bộ 12 bảng: `InnoDB`

| Bảng | Số bản ghi |
|---|---:|
| `users` | 3 |
| `genres` | 13 |
| `books` | 57 |
| `subscription_plans` | 3 |
| `subscriptions` | 1 |
| `book_loans` | 1 |
| `fines` | 0 |
| `reservations` | 0 |
| `wishlists` | 1 |
| `book_reviews` | 0 |
| `password_reset_tokens` | 0 |
| `payments` | 1 |

Trạng thái dữ liệu nghiệp vụ hiện có:

- lượt mượn: `1 RETURNED`;
- thanh toán: `1 SUCCESS`;
- gói thành viên: `1` bản ghi đang active.

## 4. Kết quả preflight dữ liệu

Tất cả truy vấn kiểm tra trước thay đổi schema đều trả về `0` lỗi:

| Kiểm tra | Số lỗi |
|---|---:|
| ISBN rỗng | 0 |
| ISBN không rỗng bị trùng | 0 |
| Tồn kho sách không hợp lệ | 0 |
| Đồng thời có `publication_date` và `publication_year` | 0 |
| Loại/trạng thái mượn không hợp lệ | 0 |
| Trạng thái đặt giữ không hợp lệ | 0 |
| Loại/trạng thái tiền phạt không hợp lệ | 0 |
| Loại/cổng/trạng thái thanh toán không hợp lệ | 0 |
| `transaction_id` thanh toán bị trùng | 0 |
| `gateway_order_id` thanh toán bị trùng | 0 |
| Một USER có nhiều gói active cùng lúc | 0 |
| Gói đã hết hạn nhưng vẫn active | 0 |

Kết luận: dữ liệu hiện tại không tạo ra xung đột đã biết cho các thay đổi dự kiến ở DB-1–DB-3.

## 5. Các điểm cần xử lý ở giai đoạn sau

DB-0 chỉ ghi nhận, chưa sửa các điểm sau:

1. `library_db1.sql` vẫn chứa câu lệnh nâng `admin@gmail.com` thành `ROLE_ADMIN`; sẽ loại khỏi file database chính ở DB-1 và chuyển thông tin khởi tạo ADMIN sang biến môi trường/IntelliJ Edit Configurations.
2. `books.isbn` hiện là `NOT NULL UNIQUE`; cần đổi để sách không có ISBN vẫn được lưu, đồng thời vẫn ngăn ISBN có giá trị bị trùng.
3. Cần bổ sung các `CHECK` cho trạng thái/loại nghiệp vụ đang được Backend dùng.
4. `payments.status` chưa chấp nhận giá trị `REFUNDED` đang có trong enum Java.
5. `payments.transaction_id` và `payments.gateway_order_id` chưa có ràng buộc unique; dữ liệu hiện tại đủ sạch để bổ sung.
6. Chưa có các composite index phục vụ các truy vấn chính; sẽ đánh giá và bổ sung ở DB-3.
7. File SQL khai báo collation khác collation thực tế; sẽ thống nhất trong file database chính thay vì để hai chuẩn song song.

## 6. Kết luận DB-0

**DB-0 hoàn thành.** Database đang chạy đã được sao lưu và kiểm tra baseline thành công. Không có schema hoặc dữ liệu nghiệp vụ nào bị thay đổi trong giai đoạn này.

Bước tiếp theo: **DB-1 — chuẩn hóa file `library_db1.sql` và dữ liệu khởi tạo**, sau đó mới tiếp tục DB-2/DB-3 và kiểm tra Backend.
