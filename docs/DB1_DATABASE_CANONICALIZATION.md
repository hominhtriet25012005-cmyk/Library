# DB-1 — Chuẩn hóa schema chính và khởi tạo ADMIN

Ngày hoàn thành: 31/10/2026

## 1. Kết quả

`database/library_db1.sql` đã được chuẩn hóa thành nguồn schema MySQL chính duy nhất:

- định nghĩa đủ 12 bảng của hệ thống;
- toàn bộ bảng dùng `InnoDB`, `utf8mb4` và `utf8mb4_0900_ai_ci`;
- giữ đầy đủ cột `publication_year`, trạng thái kiểm duyệt review và các thay đổi B0 đã áp dụng;
- bỏ toàn bộ đoạn migration điều kiện `PREPARE/EXECUTE/ALTER` khỏi file canonical;
- bỏ câu lệnh tự nâng `admin@gmail.com` từ `ROLE_USER` lên `ROLE_ADMIN`;
- không chứa `INSERT`, tài khoản, mật khẩu hoặc dữ liệu runtime.

Các file SQL/Java cũ trong thư mục `database/` chỉ là lịch sử hoặc công cụ hỗ trợ. Chúng không còn là nguồn dựng database và không được chạy nối tiếp với `library_db1.sql`.

## 2. Quy tắc khởi tạo ADMIN

Backend mặc định không tự tạo ADMIN. Việc khởi tạo chỉ chạy khi có đầy đủ biến môi trường:

| Biến | Ý nghĩa |
|---|---|
| `APP_INITIALIZE_ADMIN` | Đặt `true` để chạy khởi tạo ADMIN |
| `ADMIN_EMAIL` | Email đăng nhập ADMIN |
| `ADMIN_PASSWORD` | Mật khẩu ban đầu, tối thiểu 8 ký tự |
| `ADMIN_FULL_NAME` | Tên hiển thị; mặc định `Library Administrator` |

Trong IntelliJ IDEA:

1. Mở **Run → Edit Configurations**.
2. Chọn cấu hình **LibraryApplication**.
3. Tại **Environment variables**, thêm các biến, ví dụ:

   `APP_INITIALIZE_ADMIN=true;ADMIN_EMAIL=admin@gmail.com;ADMIN_PASSWORD=<mật khẩu riêng>;ADMIN_FULL_NAME=Administrator`

4. Chạy Backend một lần.
5. Khi ADMIN đã tồn tại, đổi `APP_INITIALIZE_ADMIN=false` hoặc xóa bốn biến trên khỏi cấu hình chạy.

Quy tắc an toàn:

- Nếu email chưa tồn tại, Backend tạo tài khoản `ROLE_ADMIN` và mã hóa mật khẩu bằng `PasswordEncoder`.
- Nếu email đã là `ROLE_ADMIN`, initializer không tạo lại và không đổi mật khẩu.
- Nếu email đang là `ROLE_USER`, Backend dừng khởi tạo và không tự nâng quyền ngầm.
- Không commit giá trị thật của `ADMIN_PASSWORD` vào Git, SQL hoặc `application.properties`.

## 3. Kiểm chứng

### Test cấu hình Backend

`StartupConfigurationTests`: **8/8 đạt**.

Các test xác nhận:

- initializer tắt theo mặc định;
- dùng đúng email, mật khẩu và tên từ cấu hình;
- từ chối chạy nếu thiếu `ADMIN_EMAIL` hoặc `ADMIN_PASSWORD`;
- không tự nâng một tài khoản `ROLE_USER` thành `ROLE_ADMIN`.

Hồi quy các suite không phụ thuộc phần H2 đang lỗi sẵn: **90/90 đạt**.

Lượt chạy rộng `*Tests` đã được thực hiện để kiểm tra chéo: tổng cộng 127 test, còn 4 failure và 23 error nằm ngoài thay đổi DB-1:

- 23 error do H2 không hiểu kiểu MySQL `SMALLINT UNSIGNED` của `publication_year`;
- 4 failure do test cũ còn đòi thông báo tiếng Anh `active membership`, trong khi Backend hiện trả thông báo tiếng Việt.

Các lỗi này không xuất phát từ initializer ADMIN hoặc file `library_db1.sql`; chưa sửa trong DB-1 để tránh lấn sang giai đoạn Backend.

### Dựng schema MySQL tạm

File canonical được nhập vào database tạm `library_db1_db1_verify_20261031`:

- số bảng: `12`;
- engine nhỏ nhất/lớn nhất: `InnoDB` / `InnoDB`;
- character set/collation: `utf8mb4` / `utf8mb4_0900_ai_ci`;
- định nghĩa cột khớp `library_db1` chính: `true`;
- tên và loại constraint khớp `library_db1` chính: `true`.

Database tạm đã được xóa sau kiểm tra. `library_db1` chính chỉ được đọc để so sánh; không có schema hoặc dữ liệu runtime nào bị thay đổi trong DB-1.

Kiểm tra chỉ đọc cuối cùng xác nhận:

- `admin@gmail.com` đang tồn tại đúng một bản ghi `ROLE_ADMIN`;
- database tạm còn lại: `0`.

## 4. Ngoài phạm vi DB-1

DB-1 chưa thực hiện các thay đổi đã dành cho giai đoạn sau:

- cho phép sách không có ISBN;
- bổ sung/chuẩn hóa CHECK constraint nghiệp vụ;
- unique key cho mã giao dịch thanh toán;
- composite index phục vụ truy vấn chính.

Các nội dung trên tiếp tục được xử lý ở DB-2 và DB-3.
