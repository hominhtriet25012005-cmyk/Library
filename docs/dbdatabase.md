# DATABASE & BACKEND — TRẠNG THÁI CHUẨN

Cập nhật lần cuối: **05/11/2026**.

Tài liệu này là sổ theo dõi ngắn gọn cho phần Database và các việc Backend phụ thuộc Database. Nội dung tại đây thay thế cách đánh số và nhận định đã lỗi thời trong hai bản review cũ. Trước khi sửa Database hoặc Backend, phải đọc file này và đối chiếu code hiện tại.

## 1. Quyết định đã chốt

- Database: **MySQL**, local tại `localhost:3306/library_db1`.
- Chỉ có một file schema nguồn: `database/library_db1.sql`.
- Không dùng Flyway hoặc Liquibase.
- `database/backups/` chỉ dùng khôi phục, không phải schema nguồn.
- File schema không chứa dữ liệu USER, sách, gói mẫu, email/mật khẩu ADMIN hoặc secret.
- Chỉ có hai vai trò: `ROLE_ADMIN` và `ROLE_USER`; không tạo `ROLE_LIBRARIAN`.
- Chỉ xác thực local bằng email/mật khẩu BCrypt và JWT; không triển khai Google OAuth.
- Gateway thanh toán duy nhất: `PAYOS`; tiền tệ giao dịch mới: `VND`.
- Không khôi phục Razorpay/Stripe vào enum Java, API hoặc CHECK database.
- Không `DROP DATABASE`, `DROP TABLE` hoặc tự sửa dữ liệu runtime để đồng bộ schema.
- ADMIN local được khởi tạo có chủ đích bằng biến môi trường, không seed/nâng quyền bằng SQL.

## 2. Vai trò thực tế của `library_db1.sql`

`database/library_db1.sql` là file tạo mới toàn bộ schema chuẩn bằng `CREATE DATABASE` và `CREATE TABLE IF NOT EXISTS`.

File này **không phải migration runner**. Khi database đang chạy cần ALTER:

1. đọc dữ liệu và metadata hiện tại;
2. dừng nếu có dữ liệu xung đột;
3. tạo backup;
4. cập nhật `library_db1.sql` trước;
5. diễn tập schema/ALTER trên database tạm;
6. áp dụng ALTER có phạm vi rõ lên `library_db1` thật;
7. kiểm tra `information_schema`, Hibernate `validate` và test liên quan;
8. ghi biên bản trong `docs/`.

Không nhét các ALTER lịch sử nối tiếp vào file schema chính. Biên bản và backup lưu lại lịch sử thay đổi.

## 3. Trạng thái các giai đoạn Database

| Giai đoạn | Trạng thái | Kết quả đã chốt |
| --- | --- | --- |
| DB-0 — Baseline và backup | **Xong** | Đọc schema/dữ liệu thật, kiểm tra xung đột và tạo điểm khôi phục trước thay đổi. |
| DB-1 — Schema canonical và ADMIN | **Xong** | `library_db1.sql` là nguồn duy nhất; bỏ ADMIN seed/nâng quyền khỏi SQL; initializer ADMIN dùng biến môi trường và từ chối nâng USER thành ADMIN âm thầm. |
| DB-2 — Ràng buộc nghiệp vụ | **Xong** | ISBN nullable/unique; CHECK cho loan, reservation, fine, payment; publication year/date và tồn kho được bảo vệ. |
| DB-3 — Payment key và composite index | **Xong** | Java/MySQL chỉ nhận `PAYOS`; unique `transaction_id`, `gateway_order_id`; thêm 11 composite index; đã áp dụng lên MySQL thật. |
| DB-4 — Tối ưu hiệu năng bổ sung | **Hoãn** | Không thêm index hàng loạt. Chỉ làm khi dữ liệu đủ lớn và `EXPLAIN ANALYZE` chứng minh truy vấn chậm. |
| DB-5 — Kiểm chứng schema | **Đã gộp và xong** | Schema tạm, metadata thật, Hibernate `validate`, contract test và regression tập trung đã đạt trong DB-1…DB-3. |
| DB-6 — Giữ constraint đúng | **Xong** | Các constraint đúng đã nằm trong schema chính và tiếp tục được kiểm tra. |
| DB-7 — Charset/collation | **Xong** | Toàn bộ bảng nguồn dùng `InnoDB`, `utf8mb4`, `utf8mb4_0900_ai_ci`. |

Cập nhật xác thực ngày **05/11/2026**: `users.password` đã là `NOT NULL`; schema Google OAuth và CHECK liên quan đã được loại bỏ khỏi Database live lẫn file SQL chính.

### DB-4 không phải việc bắt buộc lúc này

DB-3 đã có các index quan trọng cho:

- lượt mượn: user–status, book–status, status–due date–ID;
- hàng đợi đặt giữ: book–status–reserved time–ID và user–book–status;
- gói: user–active–period và active–end date;
- tiền phạt: user–status–type–created date;
- payment: fine/subscription–gateway–ID;
- đánh giá: book–active–created date.

Các index từng được đề xuất thêm nhưng hiện chưa có đủ căn cứ:

- reservation `status–available_until`: Backend chưa có repository query tương ứng;
- payment `user–created_at`, `status–created_at`: API hiện chưa lọc payment theo USER hoặc status;
- reservation `user–status` và subscription `plan–created_at`: có thể hữu ích khi dữ liệu lớn, nhưng index hiện có vẫn đủ cho quy mô local/V1.

Chỉ mở lại DB-4 sau khi có dữ liệu thực tế, slow query hoặc kế hoạch `EXPLAIN ANALYZE` cụ thể.

## 4. Schema hiện đã chốt

- `books.isbn`: `NULL UNIQUE`; nhiều sách không ISBN được lưu bằng `NULL`, không dùng chuỗi rỗng.
- `books.publication_date` và `publication_year`: chỉ lưu một trong hai; năm từ 1–9999.
- `books.available_copies`: không âm và không vượt `total_copies`.
- wishlist/review: unique theo `user_id + book_id`.
- `payments.gateway`: chỉ `PAYOS`.
- `payments.currency`: mặc định `VND`.
- `payments.transaction_id` và `gateway_order_id`: unique khi có giá trị; MySQL cho phép nhiều `NULL`.
- FK tiếp tục bảo vệ lịch sử mượn, phạt, đặt giữ, review, subscription và payment.

Biên bản chính:

- `docs/DB0_DATABASE_BASELINE.md`
- `docs/DB1_DATABASE_CANONICALIZATION.md`
- `docs/DB2_SCHEMA_CONSTRAINTS.md`
- `docs/DB3_INDEXES_AND_PAYMENT_KEYS.md`

Backup gần nhất trước DB-3:

- `database/backups/library_db1_db3_20261031_101726.sql`
- SHA-256: `B19BD9CEAA0385409BB02B56D3B3B5D9CBEB4C1C5117DD9B55968EEF18E300B4`

## 5. ADMIN và secret

### ADMIN local — đã chốt cách cấu hình

Trong IntelliJ Edit Configurations dùng:

```text
APP_INITIALIZE_ADMIN=true
ADMIN_EMAIL=<email admin>
ADMIN_PASSWORD=<mật khẩu tối thiểu 8 ký tự>
ADMIN_FULL_NAME=<tên hiển thị>
```

Quy tắc hiện có:

- không bật initializer: không tạo ADMIN;
- bật nhưng thiếu email/mật khẩu: startup thất bại rõ ràng;
- email chưa tồn tại: tạo `ROLE_ADMIN`;
- email đã là ADMIN: giữ nguyên;
- email đang là USER: từ chối nâng quyền âm thầm;
- không đặt ADMIN credential trong SQL hoặc commit lên Git.

### Secret và JWT — **BE-0 đã xong ngày 31/10/2026**

- MySQL dùng `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
- Gmail dùng `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`.
- JWT dùng `JWT_SECRET` bắt buộc tối thiểu 32 byte và `JWT_EXPIRATION_MS`.
- Source runtime không còn khóa JWT hoặc credential MySQL/Gmail dạng literal.
- JWT không còn tự quyết định quyền từ claim: mỗi request tải lại USER và vai trò hiện tại từ MySQL.
- USER bị xóa hoặc đổi vai trò mất quyền tương ứng ngay ở request tiếp theo.
- Cần đổi/thu hồi mọi credential từng xuất hiện trong source hoặc ảnh chụp cũ.

Không ghi giá trị secret vào tài liệu này. Hướng dẫn và bằng chứng: `docs/BE0_SECURITY_CONFIGURATION.md`.

## 6. Backlog Backend sau khi Database đã ổn

Database không còn blocker schema cho V1. Thứ tự Backend tiếp theo:

### BE-0 — Bảo mật cấu hình và JWT — **xong**

- MySQL, Gmail và JWT secret đã chuyển sang biến môi trường;
- không còn default JWT secret nguy hiểm;
- startup từ chối `JWT_SECRET` thiếu, dưới 32 byte hoặc thời hạn dưới 60 giây;
- quyền được đọc lại từ database ở mỗi request thay vì tin claim trong token;
- 8 test JWT/startup và 15 test phân quyền HTTP đạt (tổng 23/23);
- startup thật với MySQL `library_db1` và Hibernate `validate` đạt; chỉ còn đúng UserDetailsService đọc bảng `users`;
- chưa có blacklist/token-version theo từng phiên; đây là phạm vi riêng nếu cần đăng xuất mọi thiết bị ngay lập tức.

### BE-1 — Trả sách và lịch sử quá hạn — **đã hoàn tất 31/10/2026**

Đã sửa `BookLoanServiceImpl.checkinBook` theo quy tắc V1:

- chỉ `RETURNED` cộng một bản vào `availableCopies`;
- `DAMAGED` và `LOST` đóng lượt mượn nhưng không đưa bản sách trở lại kho sẵn;
- khi trả, `overdueDays` lưu giá trị lớn hơn giữa lịch sử đã có và số ngày trễ thực tế, không đặt lại `0`;
- `isOverdue` chuyển `false` vì lượt mượn đã đóng, còn `overdueDays` tiếp tục là dữ liệu lịch sử;
- ghi chú trả sách được trim và nối sau ghi chú cũ; ghi chú trống giữ nguyên dữ liệu cũ;
- tổng ghi chú sau khi nối bị chặn nếu vượt giới hạn 500 ký tự trước khi thay đổi trạng thái lượt mượn.

Kiểm chứng mới tại BE-1: `BookLoanCheckinHistoryTests` đạt 5/5 và `BookLoanOverdueBatchTests` đạt 1/1. BE-5 đã sửa mapping `publication_year` theo JDBC `SMALLINT`, nên `BookLoanAtomicityTests` và các test H2 liên quan đã chạy lại thành công. Ca MySQL chỉ được phép chạy trên database có hậu tố `_test`, không chạy trên `library_db1`.

**Phạm vi BE-1 là mốc lịch sử, được mở rộng bởi RB-1–RB-6:** USER gửi yêu cầu trả; ADMIN kiểm tra và hoàn tất check-in. `RETURNED` mới cộng tồn kho và có thể kích hoạt hàng chờ; `DAMAGED`/`LOST` không cộng tồn kho. Backend tự tạo phạt quá hạn/hư hỏng/mất trong transaction check-in theo chính sách đã chốt. Xem [`docs/fix-returnbook.md`](fix-returnbook.md) để biết API, schema, quy tắc và trạng thái nghiệm thu.

### BE-2 — Vòng đời đặt giữ — **đã hoàn tất 31/10/2026**

Đã hoàn thiện vòng đời hàng đợi trên Backend, không đổi schema:

- khi một lượt mượn được trả với trạng thái `RETURNED`, lượt `PENDING` đầu tiên của sách tự chuyển sang `AVAILABLE`;
- `availableAt` lấy thời điểm kích hoạt và `availableUntil` bằng `availableAt + 72 giờ`;
- job chạy mặc định mỗi 60 giây, xử lý tối đa 100 bản ghi mỗi lô, chuyển lượt quá hạn `AVAILABLE → EXPIRED` rồi kích hoạt người kế tiếp;
- hủy hoặc giao thành công đều xóa `queuePosition` của bản ghi đã kết thúc, sắp lại hàng đợi và kích hoạt lượt tiếp theo nếu kho còn bản sẵn;
- chỉ lượt `AVAILABLE`, chưa hết 72 giờ và đang đứng đầu hàng mới được ADMIN giao sách;
- luồng mượn thường không được lấy bản đang dành cho một lượt `AVAILABLE`; luồng giao đặt giữ dùng nhánh checkout riêng nhưng vẫn áp dụng hạn mức gói `min(14, hạn mức gói)`;
- `notificationSent` vẫn là `false`; email/chuông thông báo không thuộc V1.

Kiểm thử mới bao phủ kích hoạt, hết hạn, chuyển lượt, hủy, fulfill, scheduler, guard mượn thường, tích hợp trả sách và quyền HTTP; lượt nghiệm thu BE-2 đạt **19/19**, `mvn -DskipTests package` đạt. Ca MySQL opt-in cũng đã được bổ sung, nhưng không chạy trên database chính có dữ liệu vì suite chủ động từ chối khi `library_db1` không rỗng. Chi tiết tại `docs/BE2_RESERVATION_LIFECYCLE.md`.

### BE-3 — Gói thành viên/API — **đã hoàn tất 01/11/2026**

- `DELETE /api/subscription-plans/admin/{id}` xóa cứng plan nếu chưa từng có bản ghi trong `subscriptions`; nếu đã có lịch sử thì từ chối bằng HTTP 409, giữ nguyên plan, trạng thái, `updatedBy` và lịch sử (`AUD2-BE-04`);
- `PUT /api/subscription-plans/admin/{id}` đã có `@Valid`, dữ liệu thiếu/sai bị trả 400 trước khi vào service;
- tác vụ thay đổi dữ liệu đã chuyển từ `GET` sang `POST /api/subscriptions/admin/deactivate-expired`; `GET` trả 405;
- API danh sách cũ `GET /api/subscriptions/admin?page=&size=` nhận trang thật, giới hạn size 1–100 và dùng `findAll(Pageable)` thay vì tải toàn bộ bảng;
- `/api/subscriptions/admin/search` tiếp tục là API ưu tiên khi cần metadata tổng trang và bộ lọc;
- quy tắc payOS được giữ nguyên và có hồi quy: user có gói active không tạo draft mới; hủy gói thu hồi quyền ngay và được tạo draft mới;
- không đổi schema `library_db1.sql`, không kích hoạt gói thủ công thay webhook payOS.

Kiểm thử BE-3 và hồi quy payOS/phân quyền đạt **29/29** trước thay đổi AUD2-BE-04. Quy tắc hiện hành: xóa cứng plan chưa từng đăng ký; nếu có lịch sử thì từ chối xóa bằng HTTP 409, giữ nguyên trạng thái và history; không có thao tác ngừng bán. Không đổi schema; FK tiếp tục bảo vệ tham chiếu. Bộ test MySQL opt-in chưa chạy trên database chính có dữ liệu. Chi tiết tại `docs/BE3_MEMBERSHIP_API.md`.

### BE-4 — Tài khoản và sách — **đã triển khai code và qua unit baseline 02/11/2026**

- mật khẩu đăng ký và đặt lại phải có từ 8 đến 72 ký tự; thông báo validation trả bằng tiếng Việt;
- khi tạo token reset mới, Backend khóa tài khoản, xóa toàn bộ token reset cũ rồi mới lưu token mới; không đổi schema;
- `GET /api/users/profile` trả `UserDTO`; trường `password` là write-only và không được serialize trong profile/AuthResponse/danh sách;
- `createBooksBulk` chạy trong một transaction cho toàn danh sách; một sách lỗi sẽ rollback toàn bộ lô;
- ISBN optional tiếp tục giữ nguyên ở Database, Backend và hợp đồng Frontend;
- sửa hồ sơ, đổi mật khẩu khi đã đăng nhập và rate limit quên mật khẩu vẫn để ngoài V1 vì chưa chốt nghiệp vụ/hạ tầng.

Đã biên dịch main/test source và chạy trong full suite BE-5: toàn bộ unit/context/H2 baseline đạt. Chưa chạy contract/E2E trên MySQL test nên chưa đánh dấu hoàn tất nghiệm thu xuyên MySQL. Chi tiết tại `docs/BE4_ACCOUNT_BOOKS.md`.

### BE-5 — Test infrastructure — **đã triển khai hạ tầng 02/11/2026, chờ MySQL test DB**

- Maven Surefire mặc định chỉ chạy `*Test`, `*Tests`, `*TestCase`; không chạy `*IT`;
- profile `mysql-contract` chạy schema contract, Hibernate `validate` và truy vấn đọc;
- profile `mysql-e2e` chạy API/transaction/race/live HTTP;
- mọi MySQL IT bắt buộc dùng `TEST_DB_URL` trỏ tới database có hậu tố `_test`; `library_db1` bị từ chối trước khi tạo fixture;
- test mặc định có `application.properties` H2 riêng, tắt payOS và khởi tạo ADMIN;
- mapping `publication_year` dùng JDBC `SMALLINT`, xử lý lỗi H2 với `SMALLINT UNSIGNED` nhưng không đổi schema MySQL;
- full unit/context/H2 suite đạt; chưa chạy hai profile MySQL vì chưa có `TEST_DB_URL`/`TEST_DB_USERNAME` trong môi trường.

Lệnh và cách chuẩn bị `library_db1_test` nằm tại `docs/BE5_TEST_INFRASTRUCTURE.md`.

## 7. Những phần để sau V1

- subscription history/renew/check/get-by-id đầy đủ;
- API sách theo ISBN;
- email verification;
- notification đặt giữ và chuông Topbar;
- review helpful/statistics và audit kiểm duyệt;
- báo cáo/biểu đồ nâng cao;
- dọn ảnh upload nhưng không được gắn vào sách.

## 8. Quy tắc cập nhật tài liệu này

Sau mỗi giai đoạn:

1. đổi trạng thái đúng với code/database thật;
2. ghi file đã sửa và test đã chạy;
3. ghi backup/hash nếu có DDL;
4. không đánh dấu **Xong** chỉ vì build thành công;
5. nếu phát hiện kế hoạch cũ trùng với phần đã làm, cập nhật tài liệu trước khi tiếp tục code;
6. không mở rộng phạm vi ngoài giai đoạn đang được người dùng chốt.

### Bước tiếp theo được khuyến nghị

Database correctness hiện đã hoàn tất đến DB-3; **BE-0–BE-3 đã hoàn tất**; **BE-4 đã qua unit baseline**; **BE-5 đã có hạ tầng và còn chờ database `library_db1_test` để chạy contract/E2E MySQL**. Không triển khai thêm DB-4 ngay và tuyệt đối không dùng `library_db1` cho test ghi dữ liệu.
