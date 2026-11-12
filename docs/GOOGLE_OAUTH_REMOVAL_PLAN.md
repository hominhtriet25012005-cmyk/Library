# Kế hoạch loại bỏ Google OAuth

Ngày chốt phạm vi: **05/11/2026**  
Trạng thái: **Hoàn tất Bước 1–6 — hệ thống chỉ còn xác thực local bằng email/mật khẩu và JWT**

## 1. Quyết định kiến trúc

Phiên bản hiện tại của Library Management System chỉ hỗ trợ xác thực bằng:

- email và mật khẩu do hệ thống quản lý;
- JWT do Backend phát hành sau khi đăng nhập thành công;
- hai vai trò `ROLE_ADMIN` và `ROLE_USER`.

Không triển khai đăng ký hoặc đăng nhập bằng Google OAuth trong V1. Không giữ một luồng OAuth chưa hoàn chỉnh dưới dạng chức năng được công bố.

## 2. Phạm vi sẽ loại bỏ

Sau khi hoàn tất kiểm tra phụ thuộc và dữ liệu MySQL, phạm vi dự kiến loại bỏ gồm:

- enum `AuthProvider` và giá trị `GOOGLE` nếu không còn caller hợp lệ;
- field `User.authProvider`;
- field `User.googleId`;
- cột `users.auth_provider`;
- cột `users.google_id`;
- CHECK constraint `chk_users_auth_provider`;
- test mapping hoặc fixture chỉ tồn tại để kiểm tra `AuthProvider`;
- mô tả Google OAuth, đăng nhập bên thứ ba và các trường liên quan trong tài liệu dự án.

Frontend hiện không có nút Google Login, Google Identity SDK hoặc callback route nên không có chức năng giao diện Google cần tháo bỏ.

## 3. Phạm vi bắt buộc giữ lại

Việc loại bỏ Google OAuth không được làm thay đổi các chức năng sau:

- đăng ký tài khoản bằng email và mật khẩu;
- đăng nhập local và phát JWT;
- phân quyền `ROLE_ADMIN`/`ROLE_USER`;
- quên mật khẩu, reset token và đặt lại mật khẩu;
- `EmailService` cùng cấu hình SMTP;
- email người dùng trong bảng `users`;
- field `verified`, dành cho trạng thái xác minh tài khoản/email local;
- field `profileImage`, vì ảnh đại diện không phụ thuộc Google;
- thanh toán payOS và settlement đã xác minh;
- kế hoạch gửi biên nhận thanh toán qua email sau này.

Google Login và gửi biên nhận thanh toán là hai chức năng độc lập. Loại bỏ Google OAuth không cản trở việc gửi biên nhận đến `user.email`.

## 4. Quy tắc dữ liệu sau khi loại bỏ

Mục tiêu cuối cùng của tài khoản local:

- mọi user phải có email duy nhất;
- mọi user phải có mật khẩu BCrypt hợp lệ;
- cột `password` dự kiến chuyển thành `NOT NULL`;
- không còn dữ liệu hoặc constraint dành riêng cho provider Google.

Không được thực hiện ALTER nếu Database đang có một trong các trường hợp sau:

- user có `auth_provider = 'GOOGLE'`;
- user có `google_id` khác `NULL`;
- user có `password` bằng `NULL` hoặc chuỗi rỗng.

Nếu phát hiện một trong các trường hợp trên, dừng việc loại bỏ và lập phương án bảo toàn/chuyển đổi tài khoản trước. Không tự gán mật khẩu hoặc xóa user.

## 5. Ngoài phạm vi

Giai đoạn loại bỏ này không bao gồm:

- triển khai nhà cung cấp đăng nhập xã hội khác;
- triển khai xác minh email mới;
- thay đổi giao diện đăng nhập/đăng ký ngoài việc đảm bảo luồng local hoạt động;
- triển khai email biên nhận thanh toán;
- thay đổi JWT hoặc chính sách vai trò;
- thay đổi payOS;
- Flyway hoặc Liquibase.

## 6. Điều kiện nghiệm thu Bước 1

Bước chốt phạm vi được xem là hoàn tất khi:

- xác nhận hệ thống chỉ dùng xác thực local + JWT trong V1;
- liệt kê rõ thành phần dự kiến loại bỏ;
- liệt kê rõ chức năng phải giữ nguyên;
- chốt điều kiện dữ liệu khiến quá trình phải dừng;
- chưa chỉnh sửa Java, Frontend, `library_db1.sql` hoặc MySQL đang chạy.

Các điều kiện trên đã được đáp ứng ngày **05/11/2026**.

## 7. Kết quả Bước 2 — Rà soát phụ thuộc và dữ liệu

Ngày audit: **05/11/2026**  
Chế độ kiểm tra MySQL: **transaction read-only, chỉ truy vấn tổng hợp, không đọc email hoặc giá trị password hash**

### 7.1. Phụ thuộc Backend

Các thành phần thực sự dành cho Google còn lại:

| Thành phần | Hiện trạng | Xử lý dự kiến |
| --- | --- | --- |
| `domain/AuthProvider.java` | Chỉ chứa `LOCAL`, `GOOGLE` | Xóa sau khi model không còn sử dụng |
| `model/User.java` | Có `authProvider` mặc định `LOCAL` và `googleId` nullable | Xóa hai field và import liên quan |
| `database/library_db1.sql` | Có hai cột và `chk_users_auth_provider` | Chuẩn bị ALTER rồi đồng bộ file chính |

Không tìm thấy:

- dependency `spring-security-oauth2-client`;
- `oauth2Login()` trong SecurityConfig;
- Google Client ID/Secret;
- OAuth callback/controller/service;
- code xử lý `OAuth2User` hoặc Google ID token.

Vì vậy đây là việc dọn cấu trúc dự phòng, không phải tháo một luồng đăng nhập đang hoạt động.

### 7.2. Phụ thuộc test

Các test cần cập nhật khi triển khai code/schema:

- `CatalogMappingIT`: bỏ import `AuthProvider` và assert mặc định `LOCAL`.
- `PaymentSchemaContractIT`: bỏ kỳ vọng constraint `chk_users_auth_provider`.
- `Step6HLiveApiMySqlIT`: bỏ cột `auth_provider` khỏi hai câu INSERT fixture.
- `Step6GCommitRaceMySqlIT`: bỏ `auth_provider` và bổ sung password BCrypt cho fixture vì mục tiêu schema mới là `password NOT NULL`.
- `frontend/tests/admin-users.test.mjs`: dữ liệu giả đang gắn `googleId` để xác nhận UI loại trường riêng tư; có thể bỏ riêng phần Google nhưng vẫn phải giữ kiểm tra không lộ password.

Tên `AuthProvider` trong `frontend/src/auth/AuthProvider.jsx` là React context quản lý phiên đăng nhập, không liên quan enum Google của Backend và **bắt buộc giữ nguyên**.

### 7.3. Phụ thuộc tài liệu

Tài liệu chính cần đồng bộ sau khi code và schema được thay đổi:

- `docs/Library_Management_System_VI.md`: bỏ mô tả đăng nhập bên thứ ba, `authProvider`, `googleId` và Google OAuth2.
- `docs/dbdatabase.md`: bỏ Google OAuth khỏi danh sách phạm vi còn lại.

Các báo cáo lịch sử như `STEP6_TRACEABILITY.md` được giữ nguyên vì chúng ghi nhận đúng trạng thái tại thời điểm review, không phải đặc tả chức năng hiện hành.

### 7.4. Kết quả MySQL `library_db1`

| Kiểm tra tổng hợp | Kết quả |
| --- | ---: |
| Tổng tài khoản | 3 |
| Tài khoản `LOCAL` | 3 |
| Tài khoản `GOOGLE` | 0 |
| Tài khoản có `google_id` | 0 |
| Tài khoản thiếu/rỗng password | 0 |
| Password không đúng hình dạng BCrypt 60 ký tự | 0 |

Schema live khớp file SQL hiện tại:

- `password`: nullable;
- `auth_provider`: `NOT NULL`, mặc định `LOCAL`;
- `google_id`: nullable;
- có constraint `chk_users_auth_provider` nhận `LOCAL`, `GOOGLE`.

### 7.5. Kết luận cổng dữ liệu

Bước 2 **đạt**:

- không có tài khoản Google cần chuyển đổi;
- không có `google_id` cần bảo toàn;
- mọi tài khoản hiện có đều có password BCrypt;
- có thể chuẩn bị phương án đổi `password` thành `NOT NULL` và loại bỏ hai cột Google;
- chưa chạy ALTER, INSERT, UPDATE hoặc DELETE;
- chưa sửa Backend, Frontend hoặc `library_db1.sql`.

## 8. Bước 3 — Chuẩn bị thay đổi

### 8.1. Kết quả cần đạt

Sau khi thực hiện Bước 4–6:

- Backend chỉ còn tài khoản local dùng email, password BCrypt và JWT;
- entity `User` không còn mapping `auth_provider` hoặc `google_id`;
- bảng `users` bắt buộc có password và không còn hai cột Google;
- đăng ký, đăng nhập, phân quyền, quên mật khẩu và gửi email vẫn hoạt động;
- file `database/library_db1.sql` tiếp tục là nguồn schema chính duy nhất;
- không thêm Flyway, Liquibase hoặc file migration làm nguồn schema thứ hai.

### 8.2. Thay đổi code dự kiến

| File | Thay đổi | Kiểm tra tương ứng |
| --- | --- | --- |
| `Library/src/main/java/com/library/model/User.java` | Bỏ import `AuthProvider`, field `authProvider`, field `googleId` và chú thích Google; khai báo password `@Column(nullable = false, length = 255)` | Build, mapping test, đăng ký/đăng nhập local |
| `Library/src/main/java/com/library/domain/AuthProvider.java` | Xóa file vì không còn caller | `rg` không còn tham chiếu Backend |
| `Library/src/test/java/com/library/CatalogMappingIT.java` | Bỏ import và assert `AuthProvider.LOCAL`; giữ assert `verified=false` | Mapping test chạy với schema mới |
| `Library/src/test/java/com/library/PaymentSchemaContractIT.java` | Bỏ `chk_users_auth_provider` khỏi danh sách constraint bắt buộc | Contract test vẫn kiểm tra các constraint còn lại |
| `Library/src/test/java/com/library/Step6HLiveApiMySqlIT.java` | Bỏ `auth_provider` và giá trị `LOCAL` khỏi hai INSERT fixture | Live API test vẫn đăng nhập được bằng password fixture |
| `Library/src/test/java/com/library/Step6GCommitRaceMySqlIT.java` | Bỏ `auth_provider`; inject `PasswordEncoder` và ghi BCrypt password cho từng fixture | Test commit/race không vi phạm `password NOT NULL` |
| `frontend/library-frontend/tests/admin-users.test.mjs` | Bỏ dữ liệu giả và assert riêng cho `googleId`; giữ kiểm tra allowlist không đưa `password` ra UI | Frontend API test vẫn bảo vệ dữ liệu nhạy cảm |

Không sửa `frontend/library-frontend/src/auth/AuthProvider.jsx`, `useAuth.js` hoặc `main.jsx` vì đây là React Context quản lý phiên JWT, không phải Google OAuth.

### 8.3. Thay đổi schema chính dự kiến

Trong `database/library_db1.sql`, định nghĩa bảng `users` sẽ được chỉnh như sau:

- `password VARCHAR(255) NOT NULL`;
- xóa `auth_provider`;
- xóa `google_id`;
- xóa `chk_users_auth_provider`;
- giữ nguyên email, phone, profile image, role, verified và các mốc thời gian.

Việc sửa file SQL không tự thay đổi MySQL đang chạy. Database live cần chạy đúng một ALTER sau khi đã dừng Backend và kiểm tra điều kiện dữ liệu.

### 8.4. Cổng kiểm tra bắt buộc trước ALTER

Chạy truy vấn chỉ đọc sau ngay trước thời điểm thay đổi:

```sql
SELECT
    COUNT(*) AS total_users,
    SUM(auth_provider = 'GOOGLE') AS google_provider_users,
    SUM(google_id IS NOT NULL AND TRIM(google_id) <> '') AS google_id_users,
    SUM(password IS NULL OR TRIM(password) = '') AS missing_password_users,
    SUM(
        password IS NOT NULL
        AND (
            CHAR_LENGTH(password) <> 60
            OR password NOT LIKE '$2%'
        )
    ) AS invalid_bcrypt_shape_users
FROM users;
```

Chỉ tiếp tục khi bốn bộ đếm lỗi đều bằng `0`. Nếu một bộ đếm khác `0`, dừng toàn bộ thay đổi; không tự xóa user, không tự sinh password và không chạy ALTER.

Trước ALTER phải tạo bản sao lưu dữ liệu MySQL có thể phục hồi. Bản sao lưu thuộc `database/backups/`, không phải nguồn schema chính và không được nhập ngược vào `library_db1.sql`.

### 8.5. ALTER đã chuẩn bị

Sau khi dừng Backend và cổng dữ liệu đạt, chạy một câu lệnh duy nhất:

```sql
ALTER TABLE users
    MODIFY COLUMN password VARCHAR(255) NOT NULL,
    DROP CHECK chk_users_auth_provider,
    DROP COLUMN google_id,
    DROP COLUMN auth_provider;
```

Lý do gom vào một `ALTER TABLE`: MySQL thực hiện DDL với implicit commit, không thể dựa vào `ROLLBACK` giao dịch như DML. Một ALTER duy nhất giảm khoảng thời gian schema ở trạng thái dở dang.

### 8.6. Phương án khôi phục schema

Nếu cần quay lại cấu trúc cũ trước khi có dữ liệu mới, dừng Backend và chạy:

```sql
ALTER TABLE users
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' AFTER phone,
    ADD COLUMN google_id VARCHAR(255) NULL AFTER auth_provider,
    ADD CONSTRAINT chk_users_auth_provider
        CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
    MODIFY COLUMN password VARCHAR(255) NULL;
```

Với dữ liệu đã audit hiện tại, rollback này phục hồi đúng trạng thái logic: mọi tài khoản là `LOCAL` và `google_id` là `NULL`. Nếu ALTER đã chạy rồi phát sinh dữ liệu mới hoặc cần phục hồi chính xác dữ liệu tại thời điểm trước thay đổi, phải khôi phục từ bản sao lưu MySQL thay vì chỉ chạy câu lệnh trên.

Code rollback tương ứng:

- khôi phục `AuthProvider.java`;
- khôi phục hai field và mapping trong `User.java`;
- khôi phục test fixture/constraint expectation;
- khôi phục bản `database/library_db1.sql` trước thay đổi.

### 8.7. Thứ tự triển khai Bước 4–6

1. Chuẩn bị patch Backend và test, nhưng chưa startup với schema cũ sau khi `User.password` đã chuyển sang `nullable=false`.
2. Dừng Backend để không có đăng ký hoặc cập nhật tài khoản trong lúc đổi schema.
3. Chạy lại cổng dữ liệu và tạo backup MySQL.
4. Chạy ALTER duy nhất ở mục 8.5.
5. Đồng bộ `database/library_db1.sql` và tài liệu đặc tả hiện hành.
6. Build Backend, chạy test tự động và startup với `ddl-auto=validate`.
7. Kiểm tra đăng ký, đăng nhập, JWT, phân quyền, quên/reset mật khẩu và email.
8. Chạy tìm kiếm cuối để bảo đảm Backend/schema/tài liệu hiện hành không còn Google OAuth; không tính React `AuthProvider` và báo cáo lịch sử.

### 8.8. Tiêu chí nghiệm thu Bước 3

Bước 3 hoàn tất khi:

- đã liệt kê đầy đủ file code/test/schema/tài liệu cần đổi;
- đã chốt cổng dữ liệu trước ALTER;
- đã chuẩn bị ALTER và phương án khôi phục;
- đã xác định thứ tự giúp tránh lệch Hibernate mapping với MySQL;
- chưa xóa file Java, chưa sửa `User`, chưa sửa `library_db1.sql` và chưa chạy DDL.

Các điều kiện trên đã được đáp ứng ngày **05/11/2026**.

## 9. Kết quả Bước 4 — Loại bỏ code Google

Đã thực hiện ngày **05/11/2026**:

- xóa enum Backend `AuthProvider`;
- xóa `User.authProvider` và `User.googleId`;
- khai báo mapping `User.password` là `nullable = false`, dài tối đa 255 ký tự;
- cập nhật mapping test, schema contract test và fixture MySQL opt-in;
- bổ sung password BCrypt cho các fixture H2 lưu user;
- bỏ dữ liệu giả/assert `googleId` khỏi test Frontend, vẫn giữ kiểm tra loại password;
- bổ sung `UserLocalAuthenticationMappingTests` để khóa invariant tài khoản local.

Kết quả kiểm tra:

- test mới ban đầu thất bại đúng vì còn hai field Google;
- sau implementation: `UserLocalAuthenticationMappingTests` đạt `1/1`;
- toàn bộ unit test Backend đạt `168/168`;
- test `admin-users.test.mjs` đạt `4/4`;
- source Backend không còn enum, field, mapping hay fixture Google;
- các kết quả `AuthProvider` còn lại trong Frontend là React Context và được giữ có chủ đích.

Các kiểm tra MySQL live và startup Backend với `ddl-auto=validate` được thực hiện tại Bước 5 sau khi schema được đồng bộ.

## 10. Kết quả Bước 5 — Đồng bộ Database

Đã thực hiện ngày **05/11/2026** trên MySQL `library_db1` tại `127.0.0.1:3306`.

### 10.1. Kiểm tra an toàn trước ALTER

- Backend không chạy trên cổng 8000 khi bắt đầu thay đổi schema;
- Database có `3` tài khoản;
- không có tài khoản `auth_provider = 'GOOGLE'`;
- không có tài khoản chứa `google_id`;
- không có tài khoản thiếu password;
- không có password sai hình dạng BCrypt đang sử dụng trong hệ thống.

### 10.2. Backup và ALTER

Đã tạo backup đầy đủ trước thay đổi:

- file: `database/backups/library_db1_before_google_cleanup_20261105_221032.sql`;
- dung lượng: `60.520` byte;
- SHA-256: `4088278C61884D4F96E6EF84D0AA3715663D319A700E47A2F5FD2A64C977D00B`.

ALTER đã áp dụng thành công trên Database live:

- chuyển `users.password` thành `VARCHAR(255) NOT NULL`;
- xóa CHECK constraint `chk_users_auth_provider`;
- xóa cột `users.google_id`;
- xóa cột `users.auth_provider`.

Không tạo file migration riêng. Schema chuẩn tiếp tục được quản lý duy nhất trong `database/library_db1.sql` theo quyết định của dự án.

### 10.3. Đồng bộ và xác minh

File `database/library_db1.sql` đã được cập nhật cùng cấu trúc với Database live. Kiểm tra sau ALTER xác nhận:

- vẫn còn nguyên `3` tài khoản;
- `users.password` là `VARCHAR(255) NOT NULL`;
- không còn hai cột Google;
- không còn constraint Google;
- Hibernate khởi tạo `EntityManagerFactory` thành công với `spring.jpa.hibernate.ddl-auto=validate`;
- Backend khởi động thành công trên cổng 8000;
- yêu cầu `GET /` trả HTTP `200` và nội dung `Hi!`;
- tiến trình thử nghiệm đã được tắt và cổng 8000 đã được giải phóng.

## 11. Kết quả Bước 6 — Đồng bộ tài liệu và nghiệm thu

Đã thực hiện ngày **05/11/2026**.

### 11.1. Tài liệu đã đồng bộ

- `docs/Library_Management_System_VI.md` chỉ còn mô tả đăng ký/đăng nhập local bằng email, mật khẩu BCrypt và JWT;
- mô hình `User` trong tài liệu không còn `authProvider` hoặc `googleId`;
- danh sách công nghệ không còn Google OAuth2;
- `docs/dbdatabase.md` không còn coi Google OAuth là hạng mục V1 để sau;
- các báo cáo lịch sử vẫn được giữ nguyên để phản ánh đúng trạng thái tại thời điểm chúng được lập;
- React `AuthProvider` của Frontend được giữ nguyên vì đây là Context quản lý phiên JWT, không phải Google OAuth.

### 11.2. Test nghiệm thu xác thực local

Đã bổ sung `LocalAuthenticationFlowTests` cho các invariant:

- đăng ký luôn tạo `ROLE_USER`, băm mật khẩu và trả JWT;
- đăng nhập kiểm tra password local, phát hành JWT và cập nhật `lastLogin`;
- quên mật khẩu xóa token cũ, tạo token năm phút và tạo đúng link Frontend;
- email không tồn tại không bị tiết lộ và không phát sinh thư;
- reset hợp lệ thay hash và tiêu thụ token;
- token hết hạn bị xóa, không đổi mật khẩu;
- `EmailServiceImpl` tạo và gửi `MimeMessage` qua `JavaMailSender`.

Kết quả:

- nhóm test xác thực/JWT tập trung: `16/16` đạt;
- toàn bộ test Backend mặc định: `175/175` đạt;
- toàn bộ test Frontend: `104/104` đạt;
- Frontend ESLint: đạt, không còn lỗi hoặc warning;
- Frontend production build: thành công với `1.130` module.

Test email dùng `JavaMailSender` giả lập và không gửi thư thật ra ngoài. Việc này xác nhận luồng tạo nội dung và gọi mail transport mà không tạo tác động ngoài ý muốn.

### 11.3. Runtime MySQL cuối cùng

- Backend kết nối thành công MySQL `library_db1` phiên bản 9.2;
- Hibernate `ddl-auto=validate` khởi tạo `EntityManagerFactory` thành công;
- Tomcat chạy thành công trên cổng 8000;
- `GET /` trả HTTP `200` với nội dung `Hi!`;
- yêu cầu ẩn danh tới API thống kê được bảo vệ trả `403`, đúng cơ chế phân quyền;
- Backend thử nghiệm đã graceful shutdown và giải phóng cổng 8000.

### 11.4. Kết luận

Bước 1–6 của kế hoạch loại bỏ Google OAuth đã hoàn tất. Code Backend, schema MySQL, file SQL chính, Frontend và tài liệu hiện hành thống nhất với mô hình xác thực local bằng email/mật khẩu + JWT.

