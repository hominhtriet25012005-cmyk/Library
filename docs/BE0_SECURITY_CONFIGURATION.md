# BE-0 — Bảo mật cấu hình và JWT

Ngày hoàn tất mã: **31/10/2026**.

## Kết quả

- Không còn mật khẩu MySQL, Gmail hoặc khóa JWT dạng literal trong source runtime.
- `JWT_SECRET` là cấu hình bắt buộc, tối thiểu 32 byte; thiếu hoặc quá ngắn thì ứng dụng dừng startup với thông báo rõ.
- Thời hạn JWT mặc định là 24 giờ, có thể đổi bằng `JWT_EXPIRATION_MS` nhưng không được dưới 60 giây.
- JWT dùng `sub` làm email; claim `authorities` chỉ giữ để tương thích, không được dùng làm nguồn phân quyền.
- Mỗi request có Bearer token hợp lệ đều tải lại USER từ MySQL và dùng vai trò hiện tại trong database.
- USER bị xóa sẽ không tiếp tục dùng token cũ. ADMIN bị đổi thành USER sẽ mất quyền ADMIN ngay ở request tiếp theo.
- Webhook payOS vẫn bỏ qua JWT và tiếp tục được xác minh chữ ký riêng như trước.

## Biến môi trường runtime

Các biến tối thiểu để chạy local:

```text
DB_URL=jdbc:mysql://localhost:3306/library_db1
DB_USERNAME=root
DB_PASSWORD=<mật khẩu MySQL local>
JWT_SECRET=<chuỗi bí mật ngẫu nhiên tối thiểu 32 byte>
JWT_EXPIRATION_MS=86400000
```

Nếu dùng chức năng quên mật khẩu qua Gmail:

```text
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<địa chỉ Gmail>
MAIL_PASSWORD=<App Password của Gmail>
```

Nếu cần khởi tạo ADMIN local có chủ đích:

```text
APP_INITIALIZE_ADMIN=true
ADMIN_EMAIL=<email ADMIN>
ADMIN_PASSWORD=<mật khẩu ADMIN tối thiểu 8 ký tự>
ADMIN_FULL_NAME=<tên hiển thị>
```

Trong IntelliJ: **Run → Edit Configurations → LibraryApplication → Environment variables**. Không điền secret vào `application.properties`, SQL, README hoặc commit Git.

`MAIL_USERNAME` và `MAIL_PASSWORD` là tùy chọn khi không dùng gửi email. `DB_PASSWORD` có thể rỗng nếu chính MySQL local được cấu hình không mật khẩu; kết nối database vẫn phải thành công. `JWT_SECRET` luôn bắt buộc.

## Sau khi đổi khóa

- Tất cả JWT ký bằng khóa cũ sẽ hết hiệu lực; người dùng đăng nhập lại.
- Phải đổi/thu hồi các credential MySQL, Gmail và JWT từng xuất hiện trong source hoặc ảnh chụp trước đây.
- Không dùng cùng một `JWT_SECRET` giữa môi trường local, test và production.

## Giới hạn V1

Hệ thống chưa có blacklist/token-version để thu hồi riêng một JWT trước khi hết hạn. BE-0 đã xử lý thay đổi/xóa USER bằng cách đọc lại database mỗi request; thu hồi theo từng phiên hoặc đăng xuất trên mọi thiết bị sẽ là thay đổi riêng vì cần thiết kế trạng thái phiên/token.

## Kiểm chứng

- `JwtSecurityTests`: 6/6 đạt — khóa thiếu/yếu, thời hạn không an toàn, ký/đọc token, quyền hiện tại từ DB, USER đã xóa và không che lỗi nghiệp vụ thành lỗi JWT.
- `JwtPropertiesBindingTests`: 2/2 đạt — startup từ chối thiếu khóa và nhận cấu hình hợp lệ.
- Nhóm test JWT + phân quyền HTTP: tổng **23/23 đạt**.
- `LibraryApplicationTests`: startup thật đạt với MySQL `library_db1`, Hibernate `validate`; chỉ có `customUserServiceImplementation` được dùng làm `UserDetailsService`.
- Secret scan tập trung: không còn `JwtConstant.SECRET_KEY`, mật khẩu MySQL/Gmail literal trong `src/main`.

