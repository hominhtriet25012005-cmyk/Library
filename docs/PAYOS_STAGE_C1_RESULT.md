# C1 — Webhook, đối soát và kích hoạt membership

Ngày 04/10/2026. Chỉ Backend. Code và kiểm thử offline/H2 hoàn thành; chưa bật nhận tiền thật.

## API

| API | Quyền / hành vi |
|---|---|
| POST /api/payments/webhook/payos | Không cần JWT; SDK bắt buộc xác minh chữ ký payload. Chỉ POST đường dẫn này được public |
| GET /api/payments/{id}/status | Chủ giao dịch hoặc admin; chỉ đọc DB, không gọi payOS |
| POST /api/payments/{id}/reconcile | Chủ giao dịch hoặc admin; lấy kết quả từ payOS, xác nhận qua cùng đường settlement |
| GET /api/payments | Giới hạn ADMIN |
| /api/subscriptions/admin và các đường con | Giới hạn ADMIN |
| /api/subscriptions/activate | Chặn truy cập HTTP cho mọi role; không cho browser tự kích hoạt |
| POST /api/subscriptions/cancel/{id} | Kiểm tra chủ sở hữu hoặc admin trước thay đổi |

## Xác minh và transaction

1. Nhận JSON dạng Map, SDK payOS 2.0.1 normalize và verify; đã kiểm thử JSON đi qua Spring MVC rồi SDK thật với khóa giả.
2. Payload signed nhưng không tìm thấy order: ACK với IGNORED_UNKNOWN_ORDER, chỉ log order ID để theo dõi, không tạo dữ liệu/cấp quyền. Hỗ trợ probe đăng ký webhook không có order trong DB; không hardcode một orderCode mẫu để bỏ qua chữ ký.
3. Kiểm tra code thành công trong data đã ký, amount và VND. Payload non-success không tự chuyển trạng thái tiền.
4. Đối chiếu thêm GET payment link qua SDK với credentials của kênh: orderCode, paymentLinkId, amount, PAID, amountPaid đúng và amountRemaining=0; receipt reference/amount phải khớp webhook.
5. Chỉ tự động xác nhận một receipt thanh toán đủ tiền. Thiếu/thừa tiền, nhiều receipt, dữ liệu mâu thuẫn phải đối soát riêng; không tự cộng gói hoặc hoàn tiền.
6. Settlement khóa subscription rồi payment, refresh có PESSIMISTIC_WRITE để tránh dữ liệu cũ trong persistence context; kiểm tra lại gateway, loại payment, chủ sở hữu, giá/currency và link.
7. Cập nhật SUCCESS, receipt, completedAt và kích hoạt membership trong một transaction. Ngày bắt đầu theo Asia/Ho_Chi_Minh; giữ số ngày từ snapshot start/end lúc đăng ký, không lấy duration plan có thể đã sửa.
8. SUCCESS cùng receipt gọi lặp không cập nhật ngày hoặc kích hoạt lại gói đã hủy/hết hạn. Không phát event @Async để cấp quyền cho payOS; listener cũ bỏ qua PAYOS.
9. Webhook đến trước response tạo link: GET payOS làm bằng chứng liên kết; ghi link trong settlement. Response tạo link đến muộn refresh payment dưới lock, không được hạ SUCCESS xuống PROCESSING.
10. Lỗi DB/runtime không ACK thành công (HTTP 503); payload/chữ ký không hợp lệ HTTP 400; truy cập trái quyền HTTP 403. Không trả raw provider error hoặc khóa/signature trong DTO.

Đối soát chưa phải tác vụ chạy nền: gọi POST reconcile khi cần. Nếu payOS chưa PAID, trả trạng thái DB hiện tại, không suy ra thất bại/hủy từ redirect. Lookup 404/timeout không tự POST lại hoặc tạo order khác. Recovery tự động cho process chết trước create và chính sách retry vẫn chưa được bật; giữ dữ liệu để xử lý an toàn.

## File C1

Java dưới Library/src/main/java/com/library/:

| File | Thay đổi |
|---|---|
| controller/PayOSController.java (mới) | Webhook/status/reconcile và phản hồi lỗi không lộ nội dung SDK |
| service/impl/PayOSConfirmationService.java (mới) | Xác minh evidence, kiểm tra quyền owner/admin, đối soát server-to-server |
| service/impl/PayOSSettlementService.java (mới) | Transaction payment + subscription, khóa, refresh và xử lý lặp |
| service/gateway/PayOSService.java | Thêm SDK verifyWebhook, sanitize lỗi |
| service/impl/PayOSOrderStore.java | Refresh payment khi attach link để không ghi đè SUCCESS |
| service/impl/SubscriptionImpl.java | Kiểm tra quyền cancel; đường activate nội bộ legacy phải có payment SUCCESS đúng liên kết/giá/currency và không thuộc PAYOS |
| configrations/SecurityConfig.java | Public đúng webhook POST, chặn activate HTTP, bảo vệ admin; chuẩn hóa localhost CORS |
| configrations/JwtValidator.java | Webhook dùng chữ ký thay JWT; bearer sai định dạng trả 401 thay vì lỗi substring/500 |
| event/listener/PaymentEventPublisher.java | Không chạy async activation cho PAYOS |
| mapper/PaymentMapper.java | Không trả gatewaySignature |
| Library/pom.xml | H2 2.4.240 scope test, không đưa vào runtime |

Tests thêm:

- PayOSConfirmationTests: 7 test chữ ký SDK, webhook sớm, unknown probe, mismatch, gateway chưa PAID/DB lỗi và quyền owner/admin.
- configrations/PayOSHttpSecurityTests: 4 test HTTP filter chain, JSON MVC + SDK, admin/activate rules, bearer sai.
- PayOSSettlementTests: 1 test settlement/replay/duration.
- PayOSAtomicityTests: 4 test transaction thật trên H2 memory: rollback sau flush, callback đồng thời/replay gói đã hủy, evidence sai/draft hủy, response tạo link đến muộn.
- SubscriptionPayOSRoutingTests: cập nhật constructor, thêm 1 test chống hủy gói người khác.

## Kiểm chứng

- Test-first thất bại ban đầu vì chưa có PayOSSettlementService, rồi qua sau implementation.
- Đã sửa fixture test HTTP (re-stub Mockito sau exception) và đặt test JWT cùng package để không mở visibility khóa sản xuất.
- Lần cuối: Maven cached 3.9.16, JDK 23 compile release 17, offline:

```text
mvn -o -Dmaven.repo.local=C:\Users\APC\.m2\repository clean compile -Dtest=PayOSAtomicityTests,PayOSConfirmationTests,PayOSHttpSecurityTests,PayOSSettlementTests,MembershipVndTests,SubscriptionPayOSRoutingTests,PayOSMembershipTests,PayOSRepositoryQueryTests,PayOSConfigurationTests,PayOSServiceTests,StartupConfigurationTests test
139 source files compiled
Tests run: 46, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- git diff --check qua. Cảnh báo Lombok cũ và Mockito/JDK agent còn; Hibernate pool/dialect warning chỉ ở môi trường test.
- H2 dùng jdbc:h2:mem:payos_c1_<UUID>, schema sinh và dọn trong bộ nhớ mỗi test. Không dùng application.properties hoặc library_db1. H2 test KHÔNG chứng minh schema/locking/isolation MySQL thật tương đương hoàn toàn.
- Không chạy full suite hoặc startup toàn ứng dụng; không chạy CatalogMappingIT/SubscriptionPaymentMappingIT; không truy cập/sửa MySQL trong C1, không gọi payOS production hay mở tunnel.
- Giữ nguyên thay đổi trước đó của người dùng; không sửa Frontend, không tự chạy SQL đề xuất.

## Điều kiện trước khi nhận tiền thật

- Cờ PAYOS_ENABLED và PAYOS_CREATION_ENABLED vẫn mặc định false. Sau khi có đơn thật, nếu cần ngừng đơn mới chỉ tắt creation-enabled; không tắt webhook/đối soát của đơn còn chờ.
- Chưa kiểm chứng schema MySQL hiện hành. Cần kiểm tra và xin duyệt riêng phần plan/CHECK PROCESSING và các entity chặn startup trước runtime thật.
- Chưa đăng ký URL webhook payOS hay kiểm tra public HTTPS. Cần thay khóa đã lộ, cấu hình môi trường và xin duyệt số tiền thử.
- Fine và Razorpay legacy vẫn chờ C2; không coi kiểm thử C1 là xác nhận toàn bộ luồng legacy an toàn/hoạt động. Các điều chỉnh activate legacy chỉ là bảo vệ bổ sung, không phải viết lại verify Razorpay.
- Tạm chưa hỗ trợ tự động xử lý phần tiền thừa/thiếu/nhiều receipt, refund, payout, retry tạo đơn sau 404 hoặc worker đối soát. Các trường hợp này không tự cấp quyền và cần xem xét riêng.
- Giao diện admin/khách tự refresh vẫn thuộc Frontend sau này. Backend cung cấp status/read APIs, chưa có giao diện.

Nguồn đối chiếu: https://payos.vn/docs/api/ và source SDK 2.0.1 trong Maven cache (Webhook, WebhookData, PaymentLink, Transaction, WebhooksServiceImpl).

Kết luận: C1 hoàn thành triển khai Backend và kiểm chứng offline/H2. Dừng chờ người dùng chọn bước tiếp theo; chưa sẵn sàng tuyên bố thanh toán end-to-end trên MySQL/payOS thật.
