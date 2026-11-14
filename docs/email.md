# Lộ trình hệ thống thông báo và email

> Tài liệu theo dõi phạm vi, quyết định và tiến độ triển khai hệ thống thông báo cho Library Management System. Đây là kế hoạch; chưa phải xác nhận rằng các chức năng dưới đây đã được triển khai.

**Mục tiêu:** Xây dựng hộp thông báo trong website cho USER và ADMIN, đồng thời gửi email tiếng Việt cho các sự kiện nghiệp vụ quan trọng.

**Phạm vi kênh:** Thông báo trong website và email. Email là kênh bổ sung; người dùng vẫn xem được thông báo trong website khi không mở email.

**Nguyên tắc dự án:** MySQL là cơ sở dữ liệu duy nhất; `database/library_db1.sql` là file schema chính; không dùng Flyway hoặc Liquibase. Đăng nhập tiếp tục bằng email/mật khẩu nội bộ, không triển khai Google OAuth trong phạm vi này. Bí mật SMTP phải lấy từ biến môi trường, không ghi vào source code hay tài liệu.

## 1. Baseline đã kiểm tra

- Chuông USER hiện đọc khoản phạt của người dùng và lưu trạng thái đã đọc trong `localStorage`; chưa phải hộp thông báo chung lưu ở Backend.
- Chuông ADMIN hiện đọc các yêu cầu trả sách đang chờ xác nhận và cũng lưu trạng thái đã đọc trong `localStorage`.
- Các công tắc thông báo trong trang Cài đặt lưu bằng `localStorage`; Backend chưa dùng chúng để bật/tắt gửi email hay thông báo.
- Backend đã có `EmailService` và cấu hình SMTP qua `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, đang được dùng cho luồng khôi phục mật khẩu.
- Chưa có API và mô hình Backend dùng chung để lưu, phân trang, đếm chưa đọc và đánh dấu đã đọc các thông báo nghiệp vụ.
- Các cột `notification_sent` hiện có ở một số bảng không thay thế được hộp thông báo chung hoặc hàng đợi gửi email đáng tin cậy.
- Có thể giữ cập nhật chuông định kỳ ở V1; chưa cần WebSocket.

## 2. Phạm vi nghiệp vụ đề xuất

| Người nhận | Sự kiện | Thông báo trong website | Email |
|---|---|---:|---:|
| USER | Sắp đến hạn trả sách (trước hạn 3 ngày và vào ngày đến hạn) | Có | Có, nếu bật email nhắc hạn |
| USER | Lượt mượn chuyển sang quá hạn | Có, một lần cho mỗi lượt mượn | Có, nếu bật email quá hạn |
| USER | ADMIN hoàn tất kiểm tra trả sách: đã trả, hư hỏng hoặc mất | Có | Có, nếu email đã xác minh |
| USER | Khoản phạt được tạo, thanh toán một phần hoặc thanh toán xong | Có | Có, nếu email đã xác minh; mỗi lần thanh toán thành công có biên nhận |
| USER | Đặt giữ: được tạo, đến lượt, sách sẵn sàng nhận, sắp hết hạn nhận, hết hạn hoặc bị hủy | Có | Có, nếu bật email cập nhật đặt giữ |
| USER | Gói thành viên được kích hoạt/gia hạn, thanh toán thành công/thất bại cuối cùng, sắp hết hạn hoặc hết hạn | Có | Kết quả thanh toán gửi nếu email đã xác minh; nhắc hạn theo tùy chọn |
| ADMIN | USER gửi yêu cầu trả sách cần ADMIN kiểm tra | Có | Có nếu email ADMIN đã xác minh; mặc định bật |
| USER | ADMIN đăng thông báo chung | Có cho toàn bộ tài khoản USER đang hoạt động | Email chỉ gửi khi ADMIN chọn và USER đã bật nhận thông báo chung |

Không gửi thông báo cho các thao tác không cần hành động như tìm kiếm, xem sách hoặc thêm yêu thích. Thông báo nghiệp vụ cần có liên kết đến trang xử lý liên quan khi phù hợp.

## 3. Quy tắc NT-0 đã chốt cho V1

- Email được gửi đến địa chỉ lưu trong tài khoản; không cần đăng nhập bằng Google.
- Chỉ gửi email nghiệp vụ đến địa chỉ đã xác minh. Địa chỉ chưa xác minh vẫn nhận thông báo trong website và được nhắc xác minh; email khôi phục mật khẩu hiện tại giữ nguyên luồng riêng.
- Email giao dịch quan trọng không tắt được: kết quả ADMIN kiểm tra trả sách, tạo khoản phạt, kết quả thanh toán và biên nhận thanh toán. Chỉ gửi sau khi trạng thái nghiệp vụ đã được Backend xác nhận.
- USER có thể bật/tắt email nhắc hạn, thông báo quá hạn, cập nhật đặt giữ và nhắc gói thành viên. Tắt email không tắt thông báo trong website.
- Email thông báo chung là tùy chọn. ADMIN đăng trong website cho tất cả tài khoản USER đang hoạt động; email chỉ gửi cho tài khoản đã xác minh và đã bật nhận thông báo chung. V1 chưa có gửi theo nhóm tùy chỉnh hoặc newsletter.
- Khi USER gửi yêu cầu trả sách, ADMIN nhận thông báo trong website và email công việc nếu email ADMIN đã xác minh. Không gửi email lặp lại cho cùng một yêu cầu.
- Thông báo trong website được lưu ở Backend, có trạng thái đã đọc riêng theo tài khoản; USER chỉ xem/sửa trạng thái của thông báo thuộc mình. ADMIN có quyền tạo thông báo chung và xem kết quả gửi.
- Nhắc trả sách được gửi trước hạn 3 ngày và vào ngày đến hạn. Khi lượt mượn chuyển sang quá hạn, gửi một thông báo quá hạn duy nhất; không gửi lặp mỗi ngày. Nếu lượt mượn được gia hạn trước giờ gửi nhắc cũ, hủy nhắc cũ và tính theo hạn mới.
- Đặt giữ sẵn sàng nhận có thời hạn 72 giờ theo nghiệp vụ hiện tại; gửi thông báo sẵn sàng ngay và một nhắc nữa khi còn 24 giờ. Hết hạn/hủy chỉ báo một lần sau khi trạng thái cuối được xác nhận.
- Gói thành viên nhận sự kiện kích hoạt/gia hạn và kết quả thanh toán đã xác nhận; nhắc hết hạn trước 3 ngày và thông báo hết hạn một lần. Không gửi kết quả cuối dựa riêng vào trang quay về từ payOS.
- Gửi email qua hàng đợi lưu trong MySQL để lỗi SMTP không làm hỏng nghiệp vụ mượn, trả hoặc thanh toán. Mỗi email được thử tối đa 3 lần sau lần đầu, với khoảng cách tăng dần; hết lượt thì đánh dấu lỗi để ADMIN/vận hành tra cứu.
- Mỗi sự kiện/người nhận/kênh chỉ được tạo một lần theo khóa chống trùng. Khóa dựa trên loại sự kiện, đối tượng nghiệp vụ, người nhận và kênh; webhook payOS hoặc scheduler chạy lại không gửi trùng.
- Nội dung email và thông báo dùng tiếng Việt; không đưa mật khẩu, JWT hoặc bí mật cấu hình vào nội dung/log.
- Bản V1 gửi email biên nhận gồm thông tin giao dịch, số tiền, thời điểm và mã tham chiếu. Đính kèm hóa đơn PDF chưa nằm trong phạm vi V1.

### Cài đặt nhận email V1

| Tùy chọn | Mặc định | Phạm vi |
|---|---:|---|
| Nhắc hạn trả sách | Bật | Email trước hạn 3 ngày và vào ngày đến hạn |
| Cảnh báo quá hạn | Bật | Email một lần khi lượt mượn chuyển sang quá hạn; không áp dụng cho email khoản phạt/biên nhận bắt buộc |
| Cập nhật đặt giữ | Bật | Email về hàng chờ, sách sẵn sàng, nhắc hạn nhận và kết thúc đặt giữ |
| Nhắc gói thành viên | Bật | Nhắc trước hạn 3 ngày và báo hết hạn |
| Thông báo chung | Bật | Email cho thông báo ADMIN đã chọn gửi email |
| Email giao dịch tài chính và kết quả check-in | Luôn bật | Không có công tắc tắt trong V1 |
| Newsletter | Không triển khai | Ẩn công tắc cho đến khi có nội dung và nghiệp vụ newsletter thật |

## 4. Các giai đoạn triển khai

Trạng thái mặc định là `CHƯA BẮT ĐẦU`. Chỉ đánh dấu hoàn tất khi có thay đổi và bằng chứng nghiệm thu tương ứng.

| Mã | Giai đoạn | Kết quả cần đạt | Trạng thái |
|---|---|---|---|
| `NT-0` | Chốt quy tắc và ma trận sự kiện | Chốt danh sách sự kiện, người nhận, email bắt buộc/tùy chọn, chính sách email xác minh, thời điểm nhắc hạn và thông báo chung | `ĐÃ CHỐT` |
| `NT-1` | Database | Bổ sung bảng lưu thông báo, tùy chọn nhận, email outbox/trạng thái gửi và khóa chống trùng vào `database/library_db1.sql`; không xóa hay đổi nghĩa dữ liệu lịch sử hiện có | `ĐÃ ÁP DỤNG MYSQL LIVE — ĐÃ KIỂM TRA` |
| `NT-2` | Backend hộp thông báo | API lấy danh sách có phân trang, đếm chưa đọc, đánh dấu một/tất cả đã đọc; kiểm tra quyền theo USER/ADMIN | `ĐÃ KIỂM THỬ API TRÊN H2 — CHỜ KIỂM THỬ MYSQL LIVE` |
| `NT-3` | Nối sự kiện nghiệp vụ | Tạo thông báo đúng một lần cho mượn–trả, quá hạn, tiền phạt, thanh toán, đặt giữ và gói thành viên; thêm API ADMIN tạo thông báo chung | `API THÔNG BÁO CHUNG ĐÃ KIỂM THỬ H2 — CÁC SỰ KIỆN VÀ MYSQL LIVE CÒN CHỜ` |
| `NT-4` | Gửi email đáng tin cậy | Dùng cấu hình SMTP ngoài source; mẫu email tiếng Việt; xử lý gửi nền, lỗi, thử lại có giới hạn và triển khai xác minh email theo quy tắc NT-0 | `ĐÃ TRIỂN KHAI CODE — COMPILE ĐẠT; CHƯA KIỂM THỬ SMTP LIVE` |
| `NT-5` | Frontend USER/ADMIN | Thay dữ liệu giả/localStorage của chuông bằng API; hiển thị số chưa đọc, nội dung, liên kết và thao tác đã đọc; nối Cài đặt với Backend | `CODE ĐÃ TRIỂN KHAI — BUILD ĐẠT; RUNTIME CHỜ NT-6` |
| `NT-6` | Nghiệm thu và tài liệu vận hành | Kiểm tra quyền, gửi trùng, email lỗi/thử lại, tùy chọn, thông báo chung và biên nhận; hướng dẫn cấu hình SMTP bằng biến môi trường | `CHƯA BẮT ĐẦU` |

### Trạng thái hiện tại

- Kênh thông báo trong website + email: **ĐÃ CHỌN**.
- Baseline code hiện tại: **ĐÃ KIỂM TRA TĨNH**.
- Ma trận sự kiện và quy tắc email V1: **ĐÃ CHỐT Ở NT-0**; xem Mục 3.
- Database canonical: **ĐÃ TRIỂN KHAI NT-1 TRONG `database/library_db1.sql`**.
- MySQL live: **ĐÃ ÁP DỤNG NT-1 VÀ ĐỐI CHIẾU METADATA** trên schema `library_db1` (MySQL 9.2.0); bốn bảng mới tồn tại, tổng 30 constraint trong metadata và mỗi bảng hiện có 0 dòng.
- Backend hộp thông báo NT-2: **ĐÃ TRIỂN KHAI CODE VÀ COMPILE THÀNH CÔNG**; chưa tạo thông báo nghiệp vụ cho đến NT-3.
- Nối sự kiện nghiệp vụ NT-3: **ĐÃ TRIỂN KHAI CODE VÀ COMPILE THÀNH CÔNG**; email/outbox vẫn chờ NT-4.
- NT-4 email: **ĐÃ TRIỂN KHAI CODE, COMPILE MÃ NGUỒN CHÍNH ĐẠT**; worker mặc định tắt, SMTP thật chưa được cấu hình/kiểm thử trong phiên triển khai.
- Kiểm thử API NT-2/NT-3: **7 kiểm thử MockMvc/H2 đạt**; đã kiểm tra route, xác thực/quyền, validation, lưu tùy chọn, fan-out thông báo chung, chống trùng theo `requestKey` và quyền sở hữu thông báo.
- Kiểm thử live: **CHƯA THỰC HIỆN**; trong phiên chạy test, `127.0.0.1:8000` và `127.0.0.1:3306` không nhận kết nối. H2 test không ghi vào MySQL live.
- Chạy toàn bộ Maven test: **ĐANG BỊ CHẶN TRƯỚC KHI CHẠY TEST** do `BookCoverStorageServiceTests.java:116` gọi method chưa tồn tại `BookCoverStorageService.deleteUnreferenced(Set<String>, Instant)`. Các test thông báo được biên dịch riêng và chạy bằng Surefire trực tiếp.
- Frontend NT-5: **ĐÃ NỐI CHUÔNG USER/ADMIN VÀ CÀI ĐẶT EMAIL VỚI API; PRODUCTION BUILD ĐẠT**; kiểm thử runtime còn thuộc NT-6.
- Sao lưu trước khi áp dụng: `database/backups/library_db1_before_NT1_20261114.sql`; Workbench xuất cấu trúc và dữ liệu của 12/12 bảng. Cấu hình export bỏ qua triggers; không coi file này là bản dump có triggers.
- Chưa khởi động lại Backend hoặc kiểm thử API sau khi đồng bộ schema; NT-2/NT-3 đã sẵn sàng cho bước xác minh runtime.

### Kết quả NT-1 — Database

NT-1 bổ sung bốn bảng vào file schema chính:

| Bảng | Trách nhiệm |
|---|---|
| `email_verification_tokens` | Lưu hash token xác minh, hạn dùng và trạng thái đã dùng/thu hồi; không lưu token thô. Trạng thái email đã xác minh tiếp tục dùng cột `users.verified`. |
| `user_notification_preferences` | Lưu các công tắc email tùy chọn theo tài khoản. Nếu tài khoản chưa có dòng cài đặt, Backend NT-2/NT-4 phải dùng giá trị mặc định bật và tạo bản ghi khi USER lưu thay đổi. |
| `notifications` | Lưu hộp thông báo theo người nhận, liên kết nguồn nghiệp vụ, thời điểm đọc, nhóm thông báo chung và khóa chống tạo trùng. |
| `email_outbox` | Lưu email chờ gửi, trạng thái xử lý, lịch thử lại, worker lock, lỗi gần nhất và khóa chống gửi trùng. `max_attempts=4` nghĩa là lần gửi đầu cộng tối đa ba lần thử lại. |

Các ràng buộc NT-1 bảo đảm:

- chỉ chấp nhận loại sự kiện và trạng thái email đã định nghĩa cho V1;
- `source_type` và `source_id` cùng có hoặc cùng không có;
- notification đã đọc không có thời điểm trước lúc được tạo;
- outbox `SENT` bắt buộc có `sent_at`, còn trạng thái khác không được có `sent_at`;
- worker lock phải có đủ cả thời điểm và định danh worker;
- số lần gửi không âm và không vượt quá giới hạn;
- khóa `deduplication_key` là duy nhất cho từng kênh để chống gửi/tạo trùng.

NT-1 không thêm seed và không đổi dữ liệu người dùng hiện có. Ngày 2026-11-14, sau khi đọc metadata và sao lưu, bốn câu `CREATE TABLE IF NOT EXISTS` tương ứng đã được áp dụng vào schema MySQL live `library_db1` (MySQL 9.2.0). Đã xác nhận đủ bốn bảng và 30 constraint trong metadata; cả bốn bảng rỗng sau khi tạo. Bản sao lưu trước thay đổi nằm tại `database/backups/library_db1_before_NT1_20261114.sql` (cấu trúc và dữ liệu 12/12 bảng; Workbench export dùng `--skip-triggers`).

### Kết quả NT-2 — Backend hộp thông báo

NT-2 đã bổ sung entity/repository cho bốn bảng NT-1 và API dành cho tài khoản đang đăng nhập:

| HTTP | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/notifications?unreadOnly=false&page=0&size=20` | Lấy hộp thông báo của chính tài khoản, mới nhất trước; hỗ trợ chỉ lấy chưa đọc và giới hạn `size` từ 1 đến 100. |
| `GET` | `/api/notifications/unread-count` | Trả số thông báo chưa đọc của chính tài khoản. |
| `PATCH` | `/api/notifications/{id}/read` | Đánh dấu một thông báo thuộc tài khoản hiện tại là đã đọc; gọi lặp vẫn trả kết quả hiện tại. |
| `PATCH` | `/api/notifications/read-all` | Đánh dấu toàn bộ thông báo chưa đọc của tài khoản hiện tại. |
| `GET` | `/api/notifications/preferences` | Lấy tùy chọn email; nếu chưa có bản ghi thì trả bộ mặc định bật mà không ghi Database. |
| `PUT` | `/api/notifications/preferences` | Lưu toàn bộ sáu tùy chọn email của tài khoản hiện tại. |

Quy tắc bảo mật NT-2:

- endpoint không nhận `userId` từ client; danh tính luôn lấy từ JWT/Security Context;
- truy vấn đọc và cập nhật luôn kèm `recipient_user_id` của tài khoản hiện tại;
- yêu cầu đánh dấu ID thuộc người khác trả `404 NOTIFICATION_NOT_FOUND`, không tiết lộ thông báo đó có tồn tại;
- DTO không trả `deduplication_key`, `batch_key`, địa chỉ email, lỗi gửi thư hoặc dữ liệu worker lock;
- mọi endpoint `/api/notifications/**` yêu cầu đăng nhập theo quy tắc `/api/**` hiện tại.

Trong phạm vi riêng NT-2, chưa nối sự kiện nghiệp vụ, gửi email hoặc thay chuông Frontend; nối sự kiện thuộc NT-3, còn email và Frontend thuộc NT-4/NT-5. Compile Backend bằng Maven đạt `BUILD SUCCESS` trong lần triển khai NT-2. Sau khi đồng bộ schema, các endpoint NT-2 đã được kiểm thử MockMvc/H2 như ghi bên dưới; Backend chưa được khởi động lại để kiểm thử trực tiếp với MySQL live.

Kiểm thử API bổ sung ngày 2026-11-14: các endpoint lấy danh sách, đếm chưa đọc, đánh dấu một/tất cả đã đọc và GET/PUT tùy chọn email được gọi qua MockMvc. Kiểm thử H2 với Spring Boot thật xác nhận tùy chọn được lưu theo tài khoản; JWT và quyền sở hữu được áp dụng. Toàn bộ các kiểm thử NT-2 có liên quan nằm trong `NotificationHttpApiTests` và `NotificationApiH2IntegrationTests`.

### Kết quả NT-3 — Nối sự kiện nghiệp vụ

NT-3 đã bổ sung bộ phát thông báo dùng chung và khóa chống trùng ở tầng Database. Các lần gọi lại webhook payOS, scheduler hoặc thao tác retry dùng cùng loại sự kiện, nguồn và người nhận sẽ không tạo bản ghi thứ hai.

Các luồng đã nối:

- USER gửi yêu cầu trả sách: toàn bộ tài khoản `ROLE_ADMIN` nhận thông báo cần kiểm tra;
- ADMIN check-in: USER nhận kết quả đã trả/hư hỏng/mất; khoản phạt phát sinh tạo thông báo riêng;
- lượt mượn chuyển quá hạn, trước hạn 3 ngày và đúng ngày đến hạn;
- đặt giữ được tạo, đến lượt nhận sách, còn tối đa 24 giờ, hoàn tất, hủy hoặc hết hạn;
- payOS xác nhận thanh toán phạt/gói thành công hoặc đồng bộ trạng thái cuối `FAILED`/`CANCELLED`;
- gói thành viên kích hoạt/gia hạn, còn 3 ngày và hết hạn;
- ADMIN tạo thông báo chung in-app cho tất cả tài khoản `ROLE_USER`.

API thông báo chung:

| HTTP | Endpoint | Quyền | Nội dung |
|---|---|---|---|
| `POST` | `/api/admin/notifications/announcements` | `ROLE_ADMIN` | Tạo thông báo trong website cho toàn bộ `ROLE_USER`. |

Body gồm `requestKey`, `title`, `message` và `actionUrl` tùy chọn. `requestKey` dài 8–80 ký tự, chỉ dùng chữ, số, `_`, `-`; gửi lại cùng khóa không tạo trùng. `actionUrl` nếu có phải là đường dẫn nội bộ bắt đầu bằng đúng một dấu `/`.

Ví dụ:

```json
{
  "requestKey": "maintenance-20261114",
  "title": "Thông báo bảo trì",
  "message": "Thư viện số tạm ngừng trong 30 phút để bảo trì.",
  "actionUrl": "/user",
  "sendEmail": false
}
```

Scheduler thông báo mặc định quét mỗi giờ, bắt đầu sau 60 giây; có thể cấu hình bằng `app.notifications.reminder-scan-delay-ms` và `app.notifications.reminder-scan-initial-delay-ms`. Khóa nhắc hạn mượn/gói có kèm ngày hạn, nên gia hạn sang ngày mới sẽ tạo đúng thông báo cho mốc mới mà không lặp mốc cũ.

Ruling NT-3: bảng `users` hiện không có cột khóa/vô hiệu hóa tài khoản, vì vậy “USER đang hoạt động” trong phạm vi thông báo chung hiện được ánh xạ thành toàn bộ tài khoản có `role = ROLE_USER`. Khi dự án bổ sung trạng thái tài khoản, truy vấn người nhận phải được thu hẹp theo trạng thái đó.

NT-3 chỉ tạo thông báo trong website. Chưa ghi `email_outbox`, chưa gửi SMTP và chưa dùng các công tắc email; đó là phạm vi NT-4. Frontend chuông vẫn chưa chuyển sang API cho đến NT-5. Lần triển khai NT-3 trước đây báo Maven compile `BUILD SUCCESS` với 182 source files. `test-compile` toàn bộ vẫn bị chặn bởi lỗi có sẵn ngoài NT-3: `BookCoverStorageServiceTests` gọi `deleteUnreferenced(...)` nhưng service ảnh bìa chưa có method đó. Các kiểm thử NT-3 nêu dưới đây đã được biên dịch riêng và chạy trên H2; Backend chưa khởi động lại, chưa kiểm thử API trên MySQL live và chưa kiểm tra riêng từng trigger nghiệp vụ.

Kiểm thử API bổ sung ngày 2026-11-14: API ADMIN tạo thông báo chung được kiểm tra quyền, validation và fan-out bằng H2; gửi lại cùng `requestKey` vẫn chỉ có một thông báo cho mỗi USER. API hộp thông báo xác nhận mỗi USER chỉ đọc/đánh dấu được thông báo của mình. Tổng cộng hai lớp kiểm thử mới chạy **7 test, 0 lỗi, 0 failure** (`NotificationHttpApiTests`: 5; `NotificationApiH2IntegrationTests`: 2). Phần này chạy trên H2 trong bộ test, không phải MySQL live. Chưa kiểm thử từng trigger sự kiện mượn–trả, quá hạn, phạt, payOS, đặt giữ, gói thành viên và scheduler qua Backend đang chạy. Cổng 8000/3306 không truy cập được từ phiên hiện tại nên nghiệm thu runtime live còn chờ.

### Kết quả NT-4 — Gửi email đáng tin cậy

NT-4 đã nối các thông báo NT-3 vào `email_outbox`; không đổi schema và không chạy ALTER MySQL live. Tạo thông báo và job email nằm trong cùng giao dịch Database, còn SMTP được gọi bởi worker sau khi giao dịch đã commit. Vì vậy lỗi SMTP không làm rollback nghiệp vụ mượn, trả, phạt hoặc thanh toán. Gửi qua SMTP có ngữ nghĩa **at-least-once**: nếu SMTP đã nhận thư nhưng Backend dừng trước khi lưu trạng thái `SENT`, job có thể được thử lại và người nhận có thể thấy thư trùng; SMTP không cung cấp bảo đảm exactly-once.

Luồng email hiện gồm:

- Bắt buộc khi email đã xác minh: kết quả ADMIN kiểm tra trả sách; khoản phạt được tạo/thanh toán một phần/hoàn tất; kết quả giao dịch payOS; email kích hoạt/gia hạn gói và biên nhận thanh toán.
- Theo tùy chọn đã lưu: nhắc hạn, quá hạn, cập nhật đặt giữ, nhắc/hết hạn gói thành viên, yêu cầu trả sách gửi đến ADMIN, và email thông báo chung nếu ADMIN chủ động chọn gửi.
- Thông báo trong website vẫn được lưu dù email chưa xác minh hoặc người dùng đã tắt email tùy chọn.
- Email thông báo chung có trường `sendEmail`; bỏ trường này hoặc để `false` chỉ tạo thông báo trong website. Email chỉ xếp hàng cho USER đã xác minh và đang bật tùy chọn chung. Gửi lại cùng `requestKey` không tạo job mới; lựa chọn email ở lần tạo đầu tiên được giữ theo khóa chống trùng.
- Mẫu email HTML tiếng Việt escape nội dung người dùng nhập; liên kết thao tác chỉ nhận đường dẫn nội bộ hợp lệ. Biên nhận gồm mã giao dịch, số tiền, thời gian và mã tham chiếu nếu payOS trả về; email phạt nêu tổng phạt, đã trả và còn nợ. Chưa có PDF.

Worker nhận job đến hạn theo lô (mặc định 10 job mỗi 5 giây), khóa job trong transaction ngắn rồi gửi SMTP ngoài transaction. Lỗi được ghi ở `last_error` dưới dạng mã/loại lỗi, không ghi nội dung SMTP hay thông tin đăng nhập. Mỗi job thử tối đa 4 lần tổng cộng: lần đầu, rồi chờ 1 phút, 5 phút và 15 phút giữa các lần thử; sau lần thứ tư lỗi chuyển `FAILED`. Job `PROCESSING` bị bỏ khóa quá 10 phút được thu hồi an toàn để thử lại nếu còn lượt, nếu hết lượt chuyển `FAILED`. Các khóa outbox được băm để không phụ thuộc độ dài khóa thông báo và chống xếp trùng.

Đăng ký tài khoản tạo token ngẫu nhiên 256-bit, chỉ lưu SHA-256 trong `email_verification_tokens`, hết hạn sau 24 giờ và chỉ dùng một lần. Email xác minh được xếp trong outbox; token gửi thư được mã hóa AES-GCM trong `body_html` bằng khóa suy ra có phân vùng từ `JWT_SECRET`, không lưu token thô trong Database. Xác minh chỉ hoàn tất sau lần POST xác nhận trên trang tiếng Việt; GET ban đầu chỉ hiển thị nút xác minh để trình quét email không tự tiêu thụ token. Gửi lại có phản hồi chung không tiết lộ tài khoản có tồn tại, giới hạn tối đa một lần mỗi phút; job xác minh cũ đang chờ được hủy khi cấp token mới.

API xác minh:

| HTTP | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/auth/verification-email` | Yêu cầu gửi lại email; phản hồi chung và giới hạn tần suất theo tài khoản. |
| `GET` | `/auth/verify-email?token=...` | Mở trang tiếng Việt để người dùng chủ động xác nhận; không tiêu thụ token bằng GET. |
| `POST` | `/auth/verify-email` | Form xác nhận token một lần, đặt `users.verified=true` khi hợp lệ. |

Đăng ký vẫn đăng nhập được và dùng website trước khi xác minh; xác minh là điều kiện để nhận email nghiệp vụ. Quên mật khẩu giữ nguyên luồng SMTP đồng bộ cũ theo phạm vi NT-0.

#### Cấu hình vận hành SMTP

Trong IntelliJ **Run → Edit Configurations → Environment variables**, cấu hình các biến sau; không ghi giá trị bí mật vào Git hoặc file properties:

| Biến | Ví dụ/ý nghĩa |
|---|---|
| `MAIL_OUTBOX_ENABLED` | Đặt `true` để bật worker; mặc định `false`. |
| `MAIL_HOST` | Máy chủ SMTP của nhà cung cấp email. |
| `MAIL_PORT` | Thường là `587` khi dùng STARTTLS. |
| `MAIL_USERNAME` | Tài khoản gửi email. |
| `MAIL_PASSWORD` | Mật khẩu ứng dụng/SMTP secret do nhà cung cấp cấp; không phải mật khẩu đăng nhập thường. |
| `JWT_SECRET` | Khóa JWT hiện có, ít nhất 32 byte; dùng dẫn xuất khóa AES-GCM cho token xác minh trong outbox. |
| `APP_API_PUBLIC_BASE_URL` | URL Backend mà người nhận email có thể mở, ví dụ `https://<backend-public-host>`. Mặc định local `http://localhost:8000`. |
| `APP_FRONTEND_URL` | URL Frontend dùng tạo liên kết thao tác email; mặc định `http://localhost:5173`. |

Khi `MAIL_OUTBOX_ENABLED=true`, Backend dừng khởi động nếu thiếu `MAIL_USERNAME` hoặc `MAIL_PASSWORD`. Local có thể để worker tắt; job vẫn được lưu chờ trong MySQL và sẽ gửi sau khi bật worker. Vì vậy hãy cấu hình SMTP và bật worker trước khi dùng hệ thống thật để tránh tích tụ email cũ. Không đổi `JWT_SECRET` khi còn job xác minh đang chờ; nếu phải đổi, hủy các email xác minh chờ và yêu cầu người dùng xin liên kết mới.

Có thể kiểm tra trạng thái outbox bằng truy vấn chỉ đọc:

```sql
SELECT status, event_type, COUNT(*) AS total
FROM email_outbox
GROUP BY status, event_type
ORDER BY status, event_type;

SELECT id, event_type, status, attempt_count, max_attempts,
       next_attempt_at, last_error, created_at, updated_at
FROM email_outbox
WHERE status = 'FAILED'
ORDER BY updated_at DESC
LIMIT 100;
```

Lần hoàn tất NT-4: mã nguồn chính biên dịch bằng `mvnw -DskipTests compile` với `BUILD SUCCESS` (191 source files). Theo phạm vi turn này không tạo/chạy test, không khởi động Backend, không gửi thư thật và không kết nối/ghi MySQL live. Do đó hành vi SMTP, mapping schema khi Hibernate khởi động và luồng HTTP xác minh vẫn cần kiểm tra ở NT-6 sau khi cấu hình môi trường.

### Kết quả NT-5 — Frontend USER/ADMIN

- Thêm `src/api/notifications.js` dùng các endpoint NT-2 để lấy danh sách, số chưa đọc, đánh dấu một/tất cả đã đọc và lấy/lưu tùy chọn email.
- Chuông USER và ADMIN dùng chung hook gọi Backend, tải 20 thông báo mới nhất, lấy số chưa đọc độc lập, làm mới mỗi 30 giây và khi cửa sổ/tab được focus hoặc hiện lại. Trạng thái đã đọc thuộc Backend nên đồng bộ theo tài khoản, không còn dựa vào `localStorage`.
- Chuông hiển thị tiêu đề, nội dung, thời điểm, trạng thái đọc, lỗi có thể thử lại và điều hướng đến đường dẫn nội bộ an toàn do Backend cung cấp. Chuông USER không còn chỉ đọc riêng khoản phạt; chuông ADMIN không còn tự dựng thông báo từ danh sách yêu cầu trả sách.
- Cài đặt tải và lưu sáu trường tùy chọn qua `/api/notifications/preferences`; mục email yêu cầu trả sách chỉ hiển thị với ADMIN. Tùy chọn giao diện/quyền riêng tư/lịch sử tra cứu vẫn lưu cục bộ.
- Bỏ công tắc newsletter chưa thuộc V1. Giao diện ghi rõ tắt email không tắt thông báo trong website; email nghiệp vụ bắt buộc không bị các công tắc tùy chọn chi phối.
- Kết quả xác minh: `npm run build` **ĐẠT** (Vite transform 1.158 modules, exit code 0). ESLint trên các file NT-5 ngoài `Navbar.jsx` đạt; ESLint khi gồm `Navbar.jsx` báo lỗi `react-hooks/set-state-in-effect` ở hiệu ứng đồng bộ ô tìm kiếm có sẵn, nằm ngoài phần thông báo NT-5. Chưa kiểm tra Backend runtime, trình duyệt, SMTP hoặc API trên MySQL live trong giai đoạn này; các bước nghiệm thu đó thuộc NT-6.

## 5. Tiêu chí nghiệm thu tổng thể

- Thông báo được lưu ở MySQL và chỉ hiển thị cho đúng người nhận.
- Số chưa đọc, đánh dấu đã đọc và làm mới trang vẫn nhất quán giữa các thiết bị.
- Các sự kiện trong ma trận tạo đúng thông báo; sự kiện được gọi lại không tạo thông báo/email trùng.
- Lỗi gửi email không rollback nghiệp vụ hoặc làm mất thông báo trong website; có trạng thái để vận hành xử lý và thử lại.
- Cài đặt USER thực sự điều khiển các email tùy chọn; email giao dịch bắt buộc tuân theo chính sách đã chốt.
- Thông báo chung của ADMIN chỉ gửi đến đúng đối tượng đã chọn và email chỉ gửi khi ADMIN bật tùy chọn.
- Có test quyền USER/ADMIN, trường hợp chưa xác minh email (nếu dùng xác minh), SMTP lỗi, thử lại và các luồng nghiệp vụ chính.
- Tài liệu cấu hình không chứa thông tin đăng nhập SMTP thật; không dùng MySQL live để tạo dữ liệu kiểm thử. Mọi thay đổi schema live phải được kiểm tra metadata và sao lưu trước khi áp dụng.

## 6. Nhật ký quyết định và tiến độ

| Ngày | Mã | Quyết định/kết quả | Trạng thái |
|---|---|---|---|
| 2026-11-14 | Phạm vi | USER và ADMIN dùng thông báo trong website; bổ sung email cho các sự kiện nghiệp vụ quan trọng | ĐÃ CHỌN |
| 2026-11-14 | Email xác minh | Chỉ gửi thông báo nghiệp vụ đến email đã xác minh; thông báo trong website vẫn hoạt động khi chưa xác minh | ĐÃ CHỐT |
| 2026-11-14 | Email giao dịch | Kết quả check-in, khoản phạt, thanh toán và biên nhận là email giao dịch bắt buộc; không có công tắc tắt | ĐÃ CHỐT |
| 2026-11-14 | Email tùy chọn | USER có thể tắt email nhắc hạn, quá hạn, đặt giữ, thành viên và thông báo chung; mặc định bật | ĐÃ CHỐT |
| 2026-11-14 | Lịch nhắc | Mượn: trước hạn 3 ngày/vào ngày đến hạn/quá hạn một lần. Đặt giữ: sẵn sàng và nhắc khi còn 24 giờ trong cửa sổ 72 giờ. Gói: trước hạn 3 ngày và hết hạn | ĐÃ CHỐT |
| 2026-11-14 | Thông báo chung | ADMIN đăng in-app đến USER đang hoạt động; email tùy chọn theo cài đặt USER và chỉ đến email đã xác minh | ĐÃ CHỐT |
| 2026-11-14 | Kiến trúc V1 | Dùng hộp thông báo lưu Backend/MySQL; gửi email nền qua outbox; polling định kỳ, chưa cần WebSocket | ĐÃ CHỐT |
| 2026-11-14 | NT-0 | Ma trận sự kiện, tùy chọn email, xác minh email, lịch nhắc và chống gửi trùng đã ghi tại Mục 3 | ĐÃ HOÀN TẤT |
| 2026-11-14 | NT-1 | Đã áp dụng bốn bảng từ `database/library_db1.sql` vào MySQL live `library_db1` (9.2.0); xác nhận bảng/constraint và không có dữ liệu phát sinh; backup cấu trúc/dữ liệu 12/12 bảng tại `database/backups/library_db1_before_NT1_20261114.sql` | ĐÃ ÁP DỤNG VÀ KIỂM TRA |
| 2026-11-14 | NT-2 | API hộp thông báo và tùy chọn email: MockMvc/H2 xác nhận endpoint, auth/quyền, validation và lưu tùy chọn; 7 test chung NT-2/NT-3 đạt; chưa gọi API trên MySQL live | API H2 ĐẠT — LIVE CHỜ KIỂM THỬ |
| 2026-11-14 | NT-3 | API ADMIN tạo thông báo chung: H2 xác nhận fan-out, gửi lại cùng `requestKey` không nhân đôi và quyền sở hữu; các trigger nghiệp vụ khác chưa được kiểm thử; chưa gọi API trên MySQL live; email thuộc NT-4 | MỘT PHẦN API H2 ĐẠT — CÒN CHỜ |
| 2026-11-14 | NT-4 | Thêm enqueue thông báo đã xác nhận, worker SMTP nền, retry có giới hạn, template tiếng Việt, tùy chọn gửi email thông báo chung và xác minh email bằng token hash; compile mã nguồn chính đạt; chưa chạy test/SMTP/live DB | CODE ĐÃ TRIỂN KHAI — COMPILE ĐẠT; SMTP RUNTIME CHỜ NT-6 |
| 2026-11-14 | NT-5 | Chuông USER/ADMIN chuyển sang API thông báo chung; trạng thái đọc và badge lấy từ Backend; Cài đặt lưu sáu tùy chọn email qua API; bỏ newsletter và giữ giao diện/quyền riêng tư cục bộ; `npm run build` đạt | CODE ĐÃ TRIỂN KHAI — BUILD ĐẠT; RUNTIME CHỜ NT-6 |
