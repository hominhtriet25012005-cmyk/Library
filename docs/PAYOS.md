# payOS — Tích hợp, cấu hình và vận hành

Tài liệu này là nguồn hướng dẫn payOS duy nhất của project Library Management System. Nội dung hợp nhất các báo cáo A, B1, B2, C1, C2 và kiểm tra MySQL/startup trước đây, đồng thời ưu tiên trạng thái code hiện tại.

> Không ghi `Client ID`, `API Key`, `Checksum Key`, mật khẩu hoặc JWT secret vào tài liệu, source, ảnh chụp hay Git. Nếu khóa từng bị lộ, phải tạo lại khóa trên payOS và cập nhật môi trường Backend.

## 1. Trạng thái hiện tại

- Gateway thanh toán duy nhất: `PAYOS`.
- Tiền tệ: `VND`, số nguyên đồng; không nhân 100.
- SDK Backend: `vn.payos:payos-java:2.0.1`.
- Hỗ trợ thanh toán gói thành viên và tiền phạt.
- Backend tạo QR/link; Frontend hiển thị QR, mở checkout, đọc trạng thái và yêu cầu đối soát.
- Payment chỉ được xác nhận `SUCCESS` từ webhook đã xác minh chữ ký hoặc kết quả đối soát trực tiếp với payOS.
- Redirect `returnUrl`/`cancelUrl` không phải bằng chứng thanh toán.
- Kích hoạt gói và cập nhật tiền phạt được thực hiện đồng bộ, có khóa dữ liệu và chống xử lý lặp.
- Razorpay đã được loại khỏi code; Java và MySQL chỉ nhận `PAYOS`.
- Cấu hình tạo đơn mặc định tắt để tránh vô tình gọi payOS khi chạy local/test.

Đã có một lượt kiểm thử thủ công thành công: tạo VietQR, chuyển khoản, hệ thống xác nhận payment, kích hoạt gói cho USER và hiển thị lịch sử ở ADMIN. Kết quả này xác nhận luồng đã từng hoạt động end-to-end, nhưng không đảm bảo cấu hình hiện tại vẫn đúng sau khi đổi khóa, tắt kênh hoặc khởi động lại quick tunnel.

## 2. Luồng xử lý

```text
USER chọn gói hoặc khoản phạt
        ↓
Backend lấy USER, số tiền và VND từ Database
        ↓
Backend lưu subscription/payment chờ và dùng payment.id làm orderCode
        ↓
Backend gọi payOS, trả QR + checkoutUrl cho Frontend
        ↓
USER chuyển khoản
        ↓
payOS POST webhook có chữ ký đến Backend
        ↓
Backend xác minh chữ ký + đối chiếu order/amount/currency/trạng thái
        ↓
Transaction cập nhật Payment và Subscription/Fine đúng một lần
        ↓
Frontend đọc lại trạng thái từ Backend
```

Nếu webhook đến chậm hoặc tunnel bị gián đoạn, USER/ADMIN có thể gọi đối soát. Không bấm tạo đơn mới liên tục khi trạng thái giao dịch cũ chưa rõ.

## 3. Thành phần chính

### Backend

| Thành phần | Vai trò |
|---|---|
| `PayOSConfiguration` | Chỉ tạo SDK client khi `PAYOS_ENABLED=true`; từ chối startup nếu thiếu một trong ba credential |
| `PayOSService` | Tạo link, tra order và xác minh webhook qua SDK |
| `PayOSOrderStore` | Chuẩn bị draft/payment gói thành viên |
| `PayOSFineOrderStore` | Chuẩn bị payment tiền phạt |
| `PayOSMembershipPaymentService` | Điều phối tạo QR/link và tái sử dụng đơn chờ |
| `PayOSConfirmationService` | Xác minh webhook, kiểm tra quyền và đối soát |
| `PayOSSettlementService` | Hoàn tất payment + membership trong transaction |
| `PayOSFineSettlementService` | Hoàn tất payment + fine trong transaction |

### API

| Method và đường dẫn | Quyền | Mục đích |
|---|---|---|
| `POST /api/payments/webhook/payos` | Public, bắt buộc chữ ký payOS hợp lệ | Nhận webhook |
| `GET /api/payments/{id}/status` | Chủ giao dịch hoặc ADMIN | Đọc trạng thái từ Database |
| `POST /api/payments/{id}/reconcile` | Chủ giao dịch hoặc ADMIN | Tra cứu payOS và settlement nếu đủ bằng chứng |
| `POST /api/subscriptions/subscribe` | USER đăng nhập | Tạo đơn mua gói |
| `POST /api/fines/{id}/pay` | Chủ khoản phạt | Tạo đơn trả tiền phạt |
| `GET /api/payments` | ADMIN | Tra cứu danh sách giao dịch |
| `POST /api/payments/verify` | Đã ngừng, trả `410 Gone` | Không dùng xác nhận từ client |
| `/api/subscriptions/activate` | Bị chặn | Không kích hoạt thủ công |

Chỉ webhook POST được bỏ qua JWT. Các API khác tiếp tục qua JWT và kiểm tra owner/role.

## 4. Biến môi trường

Backend đọc các biến sau qua `Library/src/main/resources/application.properties`:

| Biến | Bắt buộc khi bật | Ý nghĩa |
|---|---:|---|
| `PAYOS_ENABLED` | Có | Bật SDK, webhook verification và đối soát payOS |
| `PAYOS_CREATION_ENABLED` | Có nếu tạo QR mới | Cho phép tạo đơn mới |
| `PAYOS_CLIENT_ID` | Có | Client ID của kênh thanh toán |
| `PAYOS_API_KEY` | Có | API Key của cùng kênh |
| `PAYOS_CHECKSUM_KEY` | Có | Ký request và xác minh webhook của cùng kênh |
| `PAYOS_RETURN_URL` | Có nếu tạo QR mới | URL Frontend khi thanh toán xong |
| `PAYOS_CANCEL_URL` | Có nếu tạo QR mới | URL Frontend khi hủy checkout |

Frontend dùng:

```text
VITE_PAYMENTS_ENABLED=true
```

Giá trị này nằm trong `frontend/library-frontend/.env.local` và không được commit nếu file chứa cấu hình riêng của máy.

### Cấu hình local đề xuất

Trong IntelliJ IDEA: **Run → Edit Configurations → LibraryApplication → Environment variables**. Nhập các biến theo dạng `NAME=value`, phân cách bằng dấu chấm phẩy trên Windows.

```text
PAYOS_ENABLED=true
PAYOS_CREATION_ENABLED=true
PAYOS_CLIENT_ID=<lấy từ kênh payOS>
PAYOS_API_KEY=<lấy từ kênh payOS>
PAYOS_CHECKSUM_KEY=<lấy từ kênh payOS>
PAYOS_RETURN_URL=http://localhost:5173/user/payments/result
PAYOS_CANCEL_URL=http://localhost:5173/user/payments/result
```

Không chép giá trị thật vào `application.properties`. Sau khi đổi biến môi trường phải khởi động lại Backend.

## 5. Khi nào cần Key mới?

| Tình huống | Có cần Key mới? | Việc cần làm |
|---|---:|---|
| Chỉ đóng/mở Backend | Không | Chạy lại Backend với biến môi trường cũ |
| Chỉ đóng/mở Frontend | Không | Chạy lại Vite |
| Chỉ đóng/mở cloudflared | Không | Lấy URL tunnel mới và cập nhật Webhook URL |
| Đặt `PAYOS_CREATION_ENABLED=false` rồi bật lại | Không | Đổi lại `true`, restart Backend |
| Tắt rồi kích hoạt lại cùng kênh payOS | Thường không | Dùng bộ key đang hiển thị của kênh |
| Bấm tạo lại API Key/Checksum Key | Có | Cập nhật đúng bộ key mới rồi restart Backend |
| Xóa kênh và tạo kênh khác | Có | Dùng cả Client ID/API Key/Checksum Key của kênh mới |
| Credential từng bị lộ | Có | Thu hồi/tạo lại ngay, không tiếp tục dùng khóa cũ |

Ba credential phải thuộc cùng một kênh. Trộn Client ID của kênh này với API/Checksum Key của kênh khác sẽ gây lỗi xác thực hoặc chữ ký.

## 6. Chạy local với cloudflared

Quick Tunnel chỉ phù hợp phát triển/thử nghiệm. URL `trycloudflare.com` thay đổi khi tiến trình tunnel dừng và chạy lại.

### Bước 1 — Khởi động các thành phần

1. Khởi động MySQL tại `127.0.0.1:3306` và bảo đảm có schema `library_db1`.
2. Chạy Backend tại `http://localhost:8000`.
3. Chạy Frontend tại `http://localhost:5173`.
4. Kiểm tra `http://localhost:8000` phản hồi được trước khi mở tunnel.

### Bước 2 — Mở tunnel

Nếu `cloudflared` đã có trong `PATH`:

```powershell
cloudflared tunnel --url http://localhost:8000
```

Nếu chỉ có file `.exe`, chạy tại thư mục chứa file:

```powershell
.\cloudflared-windows-amd64.exe tunnel --url http://localhost:8000
```

Không cần bấm **Connect** trong ứng dụng Cloudflare One/WARP; WARP client không phải quick tunnel dùng cho webhook.

Giữ cửa sổ Backend và cửa sổ cloudflared cùng chạy. Tìm dòng:

```text
Your quick Tunnel has been created! Visit it at:
https://<ten-ngau-nhien>.trycloudflare.com
```

### Bước 3 — Cấu hình webhook

Webhook đầy đủ:

```text
https://<ten-ngau-nhien>.trycloudflare.com/api/payments/webhook/payos
```

Vào **my.payOS → Kênh thanh toán → chọn kênh → Cài đặt/Chỉnh sửa → Webhook URL**, nhập URL trên và lưu.

Mở URL webhook trực tiếp bằng trình duyệt có thể nhận `403` hoặc lỗi vì trình duyệt gửi GET không có chữ ký. Điều này không chứng minh webhook hỏng; endpoint đúng chỉ nhận POST có payload/chữ ký payOS.

Mỗi lần quick tunnel sinh hostname mới, phải cập nhật lại Webhook URL trên payOS. Return/cancel URL local không cần đổi theo tunnel vì trình duyệt của bạn tự quay về Frontend local.

## 7. Quy trình thử thanh toán

1. Bảo đảm kênh payOS đang hoạt động và tài khoản ngân hàng còn liên kết.
2. Bảo đảm MySQL, Backend, Frontend và cloudflared đều đang chạy.
3. Bảo đảm webhook trên payOS dùng URL tunnel hiện tại.
4. Đăng nhập USER.
5. Chọn gói thành viên hoặc khoản phạt và bấm tạo mã QR.
6. Kiểm tra số tiền, nội dung chuyển khoản và order code trước khi trả tiền.
7. Chuyển đúng số tiền bằng ứng dụng ngân hàng.
8. Chờ trang trạng thái tự cập nhật; nếu chưa cập nhật, bấm **Kiểm tra trạng thái** hoặc **Đối soát với payOS** một lần.
9. Kiểm tra:
   - Payment chuyển `SUCCESS`/đã xác nhận.
   - Gói thành viên xuất hiện trong trang USER hoặc khoản phạt được cập nhật.
   - ADMIN nhìn thấy giao dịch và lượt đăng ký tương ứng.

Không tạo liên tiếp nhiều QR khi đơn cũ đang `PENDING`/`PROCESSING`. Timeout không đồng nghĩa giao dịch thất bại.

## 8. Bật và tắt an toàn

### Bật đầy đủ

```text
PAYOS_ENABLED=true
PAYOS_CREATION_ENABLED=true
```

### Tạm dừng tạo đơn mới

```text
PAYOS_ENABLED=true
PAYOS_CREATION_ENABLED=false
```

Đây là cách tắt khuyến nghị khi có giao dịch đang chờ: không tạo QR mới nhưng vẫn giữ SDK để nhận webhook và đối soát đơn cũ.

### Tắt hoàn toàn

```text
PAYOS_ENABLED=false
PAYOS_CREATION_ENABLED=false
```

Chỉ tắt hoàn toàn khi không còn payment chờ cần webhook/đối soát. Nếu `PAYOS_ENABLED=false`, Backend không có SDK client để xác minh hoặc tra cứu payOS.

## 9. Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Backend không startup và báo thiếu cấu hình payOS | Đã bật `PAYOS_ENABLED=true` nhưng thiếu credential | Điền đủ ba key cùng kênh, restart Backend |
| Frontend báo tạo đơn HTTP 503 | Creation đang tắt, SDK đang tắt hoặc payOS tạm lỗi | Kiểm tra hai cờ, log Backend và kết nối mạng; không bấm tạo lại liên tục |
| `signature`/webhook không hợp lệ | Checksum Key sai hoặc thuộc kênh khác | Lấy lại Checksum Key đúng kênh, cập nhật môi trường, restart Backend |
| Trình duyệt mở webhook thấy 403 | Gửi GET không chữ ký | Bình thường; thử qua payOS hoặc payload POST hợp lệ |
| payOS lưu webhook thất bại | Backend/tunnel chưa chạy, URL sai hoặc endpoint trả non-2xx khi probe | Kiểm tra tunnel tới Backend, đường dẫn và log Backend |
| Tunnel cũ không truy cập được | Quick tunnel đã dừng/đổi URL | Chạy lại cloudflared và cập nhật Webhook URL |
| Đã chuyển tiền nhưng UI còn chờ | Webhook chưa tới, Backend/tunnel dừng hoặc commit tạm lỗi | Giữ đơn cũ, bật Backend/tunnel rồi dùng reconcile; không tự đánh dấu SUCCESS |
| Tạo QR báo order trùng/mismatch | Kênh dùng chung hoặc ID Database đã được khôi phục/reset | Dừng tạo đơn và đối soát order code; không xóa payment hay tạo mã thay thế tùy ý |
| Return URL quay về nhưng chưa thành công | Redirect không phải bằng chứng | Đọc status hoặc reconcile từ Backend |
| Khoản phạt đã miễn nhưng khách vẫn chuyển tiền | Giao dịch cần xử lý thủ công | Không tự đổi khoản miễn thành PAID; kiểm tra ngân hàng/payOS và quyết định hoàn tiền riêng |

## 10. Quy tắc an toàn và giới hạn

- Backend tự lấy `userId`, giá, currency và quan hệ gói/fine từ Database; không tin các giá trị tài chính do Frontend gửi.
- `orderCode` dùng `payment.id`; kênh payOS phải dành riêng cho project. Không reset AUTO_INCREMENT hoặc khôi phục Database cũ vào cùng kênh mà chưa kiểm tra trùng order.
- Webhook lặp cùng receipt không được kích hoạt gói hoặc cộng tiền phạt lần hai.
- Không lưu hoặc trả `gatewaySignature` cho Frontend.
- Không có chức năng refund, payout hoặc tự xử lý tiền thừa/thiếu/nhiều receipt.
- Không có worker tự động đối soát mọi payment; hiện đối soát được gọi khi cần.
- Quick tunnel không có cam kết uptime, không dùng làm URL production lâu dài. Production cần domain HTTPS ổn định.
- ADMIN không được tự đặt payment `SUCCESS`; ADMIN chỉ yêu cầu Backend đối soát với payOS.
- USER có gói đang hiệu lực không được mua chồng. Khi USER chủ động hủy, quyền bị thu hồi ngay, không hoàn tiền và có thể mua gói mới.
- Hủy subscription không xóa payment hoặc lịch sử tài chính.

## 11. Database

Schema chính thức duy nhất là `database/library_db1.sql`.

- `payments.gateway` chỉ chấp nhận `PAYOS`.
- `payments.currency` dùng `VND`.
- `gateway_order_id` và `transaction_id` có ràng buộc duy nhất để chống ánh xạ trùng.
- Payment liên kết tới USER và tùy loại sẽ liên kết Subscription hoặc Fine/BookLoan.
- Subscription lưu snapshot tên/mã gói, giá, currency và quyền lợi tại thời điểm mua; sửa plan sau này không thay đổi lượt đã mua.
- Hibernate chạy `ddl-auto=validate`; Backend không tự tạo/sửa schema.

Không DROP/TRUNCATE, tắt foreign key hoặc sửa trực tiếp payment để “chữa” giao dịch. Luôn backup trước thay đổi DDL và đối chiếu trạng thái payOS trước thay đổi dữ liệu tài chính.

## 12. Kiểm thử và lịch sử triển khai

| Mốc | Nội dung hợp nhất | Kết quả lịch sử |
|---|---|---|
| A — Review | Phát hiện lỗ hổng activation, quyền, currency, schema, idempotency và caller Fine của gateway cũ | Chỉ review, chưa sửa code |
| B1 — SDK | Thêm SDK 2.0.1, cấu hình opt-in, adapter create/get | 13 test chọn lọc đạt |
| B2 — Tạo đơn | VND, snapshot, orderCode từ payment ID, draft/payment bền vững, QR/link | 29 test chọn lọc đạt |
| C1 — Webhook | Chữ ký, status/reconcile, owner/admin, transaction settlement và replay | 46 test chọn lọc đạt |
| C2 — Fine | Thanh toán Fine, settlement, rollback, gỡ Razorpay và đường verify cũ | 59 test chọn lọc đạt |
| MySQL/startup ban đầu | Phát hiện schema plan/review/reset-token và CHECK payment chưa đồng bộ | Là bằng chứng lịch sử; các nhóm DB sau đó đã đồng bộ schema chính |
| DB-3 | Thu hẹp gateway còn PAYOS, default VND, unique key/index | Đã áp dụng và ghi nhận trong tài liệu Database |
| Thử thật local | QR, chuyển khoản, webhook/đối soát, membership và ADMIN history | Người dùng xác nhận thành công |

Các số test trên là kết quả tại từng mốc, không thay thế một lần chạy test mới trên code hiện tại.

### Lệnh kiểm tra hiện tại

Backend:

```powershell
cd Library
.\mvnw.cmd test
```

Frontend:

```powershell
cd frontend\library-frontend
npm test
npm run lint
npm run build
```

Khi kiểm thử tự động, giữ payOS tắt và dùng test double; không để test gọi production hoặc tạo giao dịch thật.

## 13. Nguồn chính thức

- payOS API: <https://payos.vn/docs/api/>
- Java SDK: <https://payos.vn/docs/sdks/back-end/java/>
- Kiểm tra webhook signature: <https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/>
- Repository Java SDK: <https://github.com/payOSHQ/payos-lib-java>

## 14. Checklist vận hành nhanh

```text
[ ] MySQL 3306 chạy và đúng library_db1
[ ] Backend 8000 chạy
[ ] Frontend 5173 chạy
[ ] Kênh payOS đang hoạt động và ngân hàng đã liên kết
[ ] Client ID/API Key/Checksum Key thuộc cùng kênh
[ ] PAYOS_ENABLED=true
[ ] PAYOS_CREATION_ENABLED=true nếu cần tạo QR mới
[ ] Return/Cancel URL trỏ về Frontend
[ ] cloudflared đang chạy
[ ] Webhook URL dùng đúng hostname tunnel hiện tại
[ ] VITE_PAYMENTS_ENABLED=true
[ ] Số tiền/nội dung QR đúng trước khi chuyển
[ ] Sau thanh toán kiểm tra Payment + Subscription/Fine + ADMIN history
```
