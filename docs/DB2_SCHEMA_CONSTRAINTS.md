# DB-2 — ISBN tùy chọn và ràng buộc nghiệp vụ

Ngày hoàn thành: 31/10/2026

## 1. Kết quả

DB-2 đã được áp dụng đồng bộ vào file schema chính `database/library_db1.sql`, database MySQL `library_db1` và Backend.

### ISBN của sách

- `books.isbn` chuyển từ `NOT NULL` sang `NULL`, vẫn giữ `UNIQUE`.
- MySQL cho phép nhiều bản ghi có `NULL` trong unique index, vì vậy nhiều sách không có ISBN có thể cùng tồn tại.
- ISBN trống hoặc chỉ có khoảng trắng được Backend chuẩn hóa thành `NULL`.
- ISBN có giá trị được cắt khoảng trắng và kiểm tra trùng.
- Sách chưa có ISBN được phép bổ sung ISBN sau này.
- Khi ISBN đã được ghi nhận, API không cho đổi sang mã khác để tránh làm sai lịch sử định danh.

Frontend chưa được sửa trong DB-2. Nếu form vẫn đánh dấu ISBN bắt buộc thì xử lý ở giai đoạn giao diện kế tiếp; Backend và MySQL hiện đã hỗ trợ ISBN trống.

### CHECK constraint được bổ sung

| Bảng | Constraint | Giá trị hợp lệ |
|---|---|---|
| `book_loans` | `chk_book_loans_type` | `CHECKOUT`, `RENEWAL`, `RETURN` |
| `book_loans` | `chk_book_loans_status` | `CHECKED_OUT`, `RETURNED`, `OVERDUE`, `LOST`, `DAMAGED` |
| `fines` | `chk_fines_type` | `OVERDUE`, `DAMAGE`, `LOSS`, `PROCESSING` |
| `fines` | `chk_fines_status` | `PENDING`, `PARTIALLY_PAID`, `PAID`, `WAIVED` |
| `reservations` | `chk_reservations_status` | `PENDING`, `AVAILABLE`, `FULFILLED`, `CANCELLED`, `EXPIRED` |
| `payments` | `chk_payments_payment_type` | `FINE`, `MEMBERSHIP`, `LOST_BOOK_PENALTY`, `DAMAGED_BOOK_PENALTY` |
| `payments` | `chk_payments_status` | `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED` |
| `payments` | `chk_payments_gateway` | `PAYOS` (được thu hẹp ở DB-3 sau khi xác nhận không có dữ liệu gateway cũ) |

`REFUNDED` đã được thêm vào `chk_payments_status` để khớp đầy đủ với enum Backend.

## 2. An toàn dữ liệu

Trước khi ALTER, kiểm tra dữ liệu thật xác nhận:

- ISBN rỗng: `0`;
- nhóm ISBN trùng: `0`;
- giá trị type/status/gateway không hợp lệ ở các bảng liên quan: `0`.

Bản sao lưu trước ALTER:

- file: `database/backups/library_db1_db2_20261031_094054.sql`;
- kích thước: `58.197 bytes`;
- SHA-256: `F41A1D5548378AA9B09030EB1AAC23FA7A7BE9C7F35F9CC5DEF8E3AE45D31702`.

Lưu ý: MySQL tự commit DDL. Bản sao lưu trên là điểm khôi phục của DB-2.

## 3. Kiểm chứng

Schema canonical đã được dựng trong database tạm rồi xóa sau khi kiểm tra:

- đủ `12` bảng;
- `books.isbn` có `IS_NULLABLE = YES`;
- chèn thành công hai sách cùng có `ISBN = NULL`;
- đủ `8` constraint DB-2;
- cả 8 trường hợp type/status/gateway sai đều bị MySQL từ chối.

Sau khi áp dụng lên `library_db1` thật:

- `books.isbn` có `IS_NULLABLE = YES`;
- đủ `8/8` constraint DB-2 và đều được MySQL thực thi;
- Hibernate `ddl-auto=validate` thành công;
- `BookCatalogTests`: `17/17` đạt;
- `BookCatalogTests + CatalogMappingIT + PaymentSchemaContractIT`: `24/24` đạt;
- bộ hồi quy không gồm các test lỗi nền đã biết: `94/94` đạt.

`LibraryApplicationTests.contextLoads` vẫn phụ thuộc cấu hình datasource riêng khi chạy test và không thuộc thay đổi DB-2. Các suite H2/PayOS lỗi nền đã được nhận diện từ DB-1 tiếp tục được loại khỏi lượt hồi quy trên; DB-2 không che giấu hoặc sửa lan sang các nhóm đó.

## 4. Ngoài phạm vi DB-2

DB-2 chưa thêm unique key cho mã giao dịch thanh toán và chưa thêm composite index tối ưu truy vấn. Hai nội dung này đã được hoàn tất ở DB-3; xem `DB3_INDEXES_AND_PAYMENT_KEYS.md`.
