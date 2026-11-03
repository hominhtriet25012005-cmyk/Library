# Giai đoạn A — Rà soát tích hợp payOS + VietQR

Ngày: 04/10/2026. Trạng thái: hoàn thành rà soát tĩnh và kế hoạch, CHƯA triển khai.

## Phạm vi và bằng chứng

- Đã đọc luồng subscription/payment/fine, controller, DTO, mapper, repository, entity, event, security, pom và các cấu hình liên quan; đối chiếu phần thanh toán trong Library_Management_System_VI.md, database/library_db1.sql và đề xuất stage4.
- Không sửa source, cấu hình chạy hay SQL. Không kết nối/gọi API payOS, không dùng khóa từ ảnh, không mở tunnel, không ghi MySQL. Chỉ thêm tài liệu này.
- Chưa kiểm tra lại schema MySQL trực tiếp trong A. Nhận xét schema dưới đây dựa trên SQL lưu trong workspace; không coi bản SQL là bằng chứng trạng thái live hiện tại.
- Không build/startup/test trong A; không xác nhận ứng dụng hiện chạy thành công.
- Git Library có thay đổi từ trước ở entity và test; giữ nguyên toàn bộ. Không tìm thấy AGENTS.md trong danh sách file workspace.
- Workspace hiện chỉ có Library (Backend), docs và database; chưa tìm thấy source Frontend/package.json.
- pom: Spring Boot 4.1.1, java.version=17, Razorpay SDK 1.4.10. Cần kiểm chứng tương thích dependency/JSON khi thêm SDK payOS, không đổi phiên bản Spring Boot trong phạm vi này.
- application.properties: port 8000, datasource library_db1, ddl-auto=validate, app.initialize-admin=false. Đây là cấu hình, không phải xác nhận server đang chạy.
- Callback cũ: http://localhost:5173} có dấu } thừa. CORS ghi http://localhost:5173/; cần chuẩn hóa origin không có slash cuối. Port Frontend 5173 chỉ là gợi ý từ cấu hình cũ, chưa xác minh.

## Kết quả review

Đường dẫn Java bên dưới tính từ Library/src/main/java/com/library/.

| Priority | Component | File/Table | Problem / Cause | Proposed Fix |
|---|---|---|---|---|
| CRITICAL | Kích hoạt membership | controller/SubscriptionController.java; service/impl/SubscriptionImpl.java | POST /api/subscriptions/activate chỉ cần đăng nhập; activateSubscription bỏ qua paymentId, không đối chiếu chủ sở hữu hoặc SUCCESS | Chặn kích hoạt tùy ý; endpoint cũ nếu giữ phải kiểm tra quyền, payment thành công, liên kết subscription và xử lý một lần; webhook là đường xác nhận chính |
| HIGH | Quyền đọc / thao tác | controller/PaymentController.java; configrations/SecurityConfig.java | GET /api/payments cho mọi user đăng nhập đọc tất cả; /api/subscriptions/admin/** cũng không khớp rule /api/admin/** | Giới hạn endpoint admin đúng role; endpoint trạng thái chỉ chủ giao dịch hoặc admin |
| HIGH | Subscription input | mapper/SubscriptionMapper.java; service/impl/SubscriptionImpl.java | toEntity nhận id từ DTO đầu vào; tạo subscription có nguy cơ merge vào bản ghi có sẵn; chưa kiểm tra plan active | Tạo mới bằng ID server, không tin id/user/price từ client; kiểm tra plan hợp lệ |
| HIGH | Thiếu currency | modal/Subscription.java; mapper/SubscriptionMapper.java | initializeFromPlan không gán currency dù cột NOT NULL; DTO output cũng bỏ currency | Chụp giá/currency VND từ plan vào subscription và payment; mapper trả currency |
| HIGH | Tiền tệ / mapping | modal/SubscriptionPlan.java; payload/dto/SubscriptionPlanDTO.java; modal/Payment.java | Plan price Long nhưng SQL DECIMAL(10,2); Payment default INR; Razorpay nhân 100 | Plan dùng BigDecimal tương thích DB, chuyển sang Long VND bằng chuyển đổi chính xác; từ chối phần lẻ/tràn số; payOS dùng số nguyên đồng, không nhân 100 |
| HIGH | Schema chưa đồng bộ | subscription_plans; payments | SQL lưu thiếu 10 cột plan mà entity dùng; CHECK payment không có PROCESSING nhưng service ghi trạng thái này | Tiền điều kiện riêng: kiểm tra live schema và xin duyệt thay đổi nhỏ cần thiết; không tự chạy stage4 SQL |
| HIGH | Gateway cũ | service/gateway/RazorpayService.java; service/impl/PaymentServiceImpl.java; pom.xml | Chỉ tích hợp Razorpay; chưa có PAYOS, webhook hay truy vấn trạng thái từng giao dịch | Thay adapter/config/dependency và hợp đồng API; ngừng tạo giao dịch Razorpay mới |
| HIGH | Verify hiện tại | service/gateway/RazorpayService.java | Đọc status nhưng không dùng; chỉ so giá plan hiện tại, không so snapshot payment, không xác minh chữ ký callback | Loại luồng verify cũ; dùng xác minh payOS và đối chiếu payment đã lưu, không dùng giá plan có thể thay đổi |
| HIGH | Tính nguyên tử / trùng lặp | service/impl/PaymentServiceImpl.java; event/listener/PaymentEventPublisher.java; service/impl/SubscriptionImpl.java | Save SUCCESS rồi phát event @Async; quyền lợi có thể chưa được kích hoạt khi payment đã SUCCESS; gọi lặp sẽ đặt lại ngày bắt đầu | Cập nhật payment và quyền lợi trong một transaction, khóa hàng/kiểm soát đồng thời, một đường finalize dùng chung; không giữ listener kích hoạt trùng |
| HIGH | Tạo đơn / timeout | service/impl/PaymentServiceImpl.java; repository/PaymentRepository.java | Save trước gọi gateway, lỗi có thể để lại bản ghi chờ; gateway không hỗ trợ vẫn bị ghi PROCESSING | Lưu mã tương quan bền vững trước gọi ngoài; từ chối gateway sai; timeout không kết luận chưa nhận tiền; tra cứu lại cùng mã trước tạo mới |
| HIGH | Phụ thuộc fine | service/impl/FineServiceImpl.java; service/impl/PaymentServiceImpl.java; event/listener/PaymentEventPublisher.java | Fine cũng gọi Razorpay; payment chưa gắn fineId/bookLoanId; nhánh event fine trống; chưa kiểm tra chủ fine; dùng toàn bộ amount thay vì số dư | Tách nhóm C2, bảo toàn luồng tiền phạt khi bỏ Razorpay; kiểm tra chủ sở hữu/số dư, liên kết và cập nhật một lần; không tự thay chính sách tiền phạt |
| MEDIUM | DTO / API | payload/request/PaymentVerifyRequest.java; payload/response/PaymentInitiateResponse.java; payload/response/PaymentLinkResponse.java; mapper/PaymentMapper.java | Trường Razorpay/Stripe, thiếu currency/QR; trả gatewaySignature không cần cho UI | Dùng trường trung lập, thêm dữ liệu cần hiển thị QR, không trả chữ ký/bí mật; rà soát tương thích client trước khi xóa trường |
| MEDIUM | URL / Frontend | application.properties; configrations/SecurityConfig.java | Callback sai dấu }; chưa có source giao diện; origin cần chuẩn hóa | Cấu hình return/cancel URL phía server; xác minh port Frontend; sửa CORS theo origin thực tế |
| MEDIUM | Plan quản trị | service/impl/SubscriptionPlanServiceImpl.java | updateSubscriptionPlan lưu xong trả null | Ghi nhận backlog cũ; chỉ sửa cùng nhóm plan nếu được duyệt, không gom vào thay SDK |

## Thiết kế đề xuất (chưa thực hiện)

Luồng: user chọn plan -> Backend tạo subscription chưa active + payment -> payOS trả QR/link -> user chuyển tiền -> webhook xác minh -> transaction cập nhật payment và subscription -> UI đọc trạng thái từ Backend.

### API và dữ liệu

- Giữ POST /api/subscriptions/subscribe cho luồng hiện tại. Server chọn PAYOS, lấy user đăng nhập và giá từ plan; request không được quyết định số tiền, gateway hoặc ID bản ghi mới.
- Response dự kiến giữ paymentId, amount, checkoutUrl, gateway, message/success; bổ sung currency, qrCode, orderCode/paymentLinkId khi cần. success ở đây chỉ là tạo đơn thành công, không phải đã trả tiền.
- Thêm POST /api/payments/webhook/payos. Chỉ endpoint POST này được đi qua không cần JWT; vẫn bắt buộc chữ ký hợp lệ. Không permitAll toàn bộ /api/payments/**.
- Thêm GET /api/payments/{id}/status cho chủ giao dịch/admin; UI hỏi trạng thái DB, không gọi payOS mỗi lần polling.
- GET /api/payments giữ mục đích danh sách admin, thêm giới hạn quyền. Return/cancel URL chỉ hiển thị, không tự thay trạng thái từ query string.
- Loại verify Razorpay khi chuyển client; không để endpoint kích hoạt cũ trở thành đường bỏ qua thanh toán.

### Tận dụng bảng payments hiện có

- Ưu tiên orderCode = payment.id (số nguyên dương, kiểm tra giới hạn SDK/API); không dùng timestamp theo giây. Cần xác nhận kênh payOS này dành riêng cho project, không trùng đơn đã tạo thủ công/hệ thống khác. Nếu không, phải chốt phương án namespace/mapping trước B2.
- gateway=PAYOS; gateway_order_id lưu paymentLinkId; gateway_payment_id lưu reference giao dịch; transaction_id giữ mã nội bộ, không đổi nghĩa tùy bước.
- Không thấy CHECK gateway trong SQL lưu: PAYOS có thể dùng VARCHAR hiện tại, chưa có cơ sở cần bảng payos_payments riêng.
- Không xóa enum cũ nếu live DB còn bản ghi Razorpay/Stripe; giữ khả năng đọc lịch sử nhưng ngừng tích hợp tạo đơn cũ.
- Ưu tiên lấy lại QR/link từ API khi cần, không mặc định thêm cột QR. Nếu cần thêm index/unique constraint phải đối chiếu dữ liệu và xin duyệt riêng.
- Không đổi nhãn INR cũ thành VND. Backend ghi rõ VND cho giao dịch mới; thay DEFAULT DB là đề xuất riêng, không phải điều kiện bắt buộc nếu mọi insert đã gán currency.
- Không tự mở rộng CHECK/đổi nghĩa trạng thái để lách mismatch. Vòng đời PROCESSING hiện có được giữ trong đề xuất; DDL nếu cần phải được duyệt.

### Xác nhận an toàn

- SDK verify chữ ký, rồi kiểm tra kết quả, orderCode, paymentLinkId, amount, currency và gateway khớp bản ghi.
- Phân biệt payload kiểm tra webhook của payOS với giao dịch thật; không tạo/quy đổi giao dịch từ payload lạ. Test đúng hình dạng JSON SDK với Spring MVC, không mặc định import trong demo đúng phiên bản.
- Khóa payment và subscription/fine theo thứ tự nhất quán, kiểm tra SUCCESS trước khi áp dụng quyền lợi. Lỗi ghi quyền lợi phải rollback cả cập nhật SUCCESS, cho phép retry có kiểm soát.
- Không dùng @Async để thực hiện quyền lợi cốt lõi tách khỏi commit thanh toán. Event thông báo chỉ sau commit nếu chức năng hiện tại cần.
- Webhook có thể đến trước response tạo link: cần mã order đã lưu và đối soát server-to-server khi thiếu paymentLinkId, không bỏ mất thông báo hoặc tin client.
- Chỉ ACK thành công sau xử lý bền vững; phân loại lỗi chữ ký/input với lỗi DB tạm thời. Webhook lặp đã xử lý trả thành công mà không cộng quyền lợi lần nữa.
- Timeout hoặc người dùng đóng trang không phải FAILED/CANCELLED. Có đường đối soát qua API payOS dùng cùng hàm finalize khi webhook chậm/mất; không tự hoàn tiền/chuyển tiền đi.
- Trạng thái quá hạn, thanh toán muộn, thiếu/thừa tiền cần đối soát; không tự kích hoạt khi không khớp, không biến mất tiền đã nhận. Chốt quy tắc trước kiểm thử thật.
- Không tự thay chính sách gia hạn/cộng dồn nhiều gói; hiện code đặt ngày bắt đầu khi kích hoạt. Nếu cần đổi phải xin quyết định riêng.

## Kế hoạch triển khai có điểm dừng

Mỗi nhóm chỉ bắt đầu khi user yêu cầu. Báo file thay đổi, lý do, lệnh kiểm thử và kết quả trước khi sang nhóm sau.

| Nhóm | File / phạm vi | Điều kiện nghiệm thu |
|---|---|---|
| B1 — Adapter và cấu hình | pom.xml; config payOS mới; service/gateway/PayOSService mới; application.properties; test cấu hình/adapter | Chọn SDK cố định, Maven compile và test mock tạo link/JSON/error; không gọi production; không phụ thuộc khóa thật để chạy unit test. Chưa chuyển luồng runtime, không bật nhận tiền |
| B2 — VND và tạo đơn | PaymentGateway; Payment/Subscription/SubscriptionPlan; DTO/mapper tương ứng; SubscriptionImpl; PaymentService/Impl; response; cấu hình callback | Giá do server quyết định, VND đúng đơn vị, ID duy nhất, từ chối ID/user/giá giả, plan inactive, lỗi/timeout không tạo link trùng. Chỉ mock trước khi B0 và C đạt |
| B0 — Tiền điều kiện schema (phê duyệt riêng trước runtime) | Kiểm tra live library_db1; đối chiếu stage4_schema_proposal.sql; mapping/test liên quan | Trình đúng DDL tối thiểu còn cần, backup, duyệt từng nhóm; validate plan/payment và các entity chặn startup. Không mặc định bản SQL trước đây đã chạy |
| C1 — Webhook + membership + quyền | PaymentController; webhook controller mới; SecurityConfig/JwtValidator khi cần; PaymentRepository; transaction finalize; SubscriptionImpl; listener; test | Chữ ký/amount/order/currency sai không cấp quyền; user không đọc/gọi thay người khác; webhook lặp/đồng thời chỉ cấp một lần; rollback khi kích hoạt lỗi; webhook JSON mẫu hoạt động |
| C2 — Caller fine và tháo Razorpay | FineServiceImpl, fine/payment mapping/repository liên quan; bỏ adapter/dependency/config/verify Razorpay sau khi hết caller | Luồng phạt không còn gọi gateway cũ; liên kết đúng chủ/số dư, cập nhật một lần; regression payment/fine. Không thêm payout hoặc chính sách phạt mới |
| D — QR và cập nhật giao diện | Frontend chưa có trong workspace; API trạng thái phía Backend | Có source Frontend trước khi chốt file. QR theo đơn, pending/success/error rõ ràng; polling có giới hạn và dừng khi rời trang/hết hạn; admin tự tải dữ liệu khi mở trang; không tin returnUrl |
| E — Kiểm thử local toàn luồng | Cấu hình môi trường, webhook HTTPS, integration/security tests | Khóa đã thay mới, tunnel được user duyệt, startup validate thành công; user duyệt số tiền và dữ liệu thử; đóng trình duyệt vẫn ghi nhận, callback lặp không cộng gói, admin/user đồng bộ |

Thứ tự: B1 -> B2 (mock) -> B0 được phê duyệt -> C1 -> C2 -> D -> E. Không đưa adapter B1/B2 chưa có webhook vào nhận tiền thật.

Mỗi nhóm sửa code: mvn clean compile và unit tests có chọn lọc; khi đủ điều kiện chạy suite phù hợp. Chỉ chạy test tích hợp MySQL sau khi đọc cấu hình và kiểm soát dữ liệu; không gọi test context mặc định có thể chạy initializer. Không xem unit tests qua là bằng chứng schema/startup/CRUD đã qua.

## Tiền điều kiện và giới hạn

- Stage4 trước đó vẫn là bản đề xuất, trong đó hướng VNPAY nay được thay bằng quyết định payOS; KHÔNG chạy nguyên file đó chỉ vì duyệt giai đoạn A/B.
- Những mapping book_reviews/password_reset_tokens đã ghi nhận ở giai đoạn trước là phụ thuộc startup, không phải chức năng mới của payOS; phải kiểm tra trạng thái live trước khi xử lý.
- Frontend cần được cung cấp đường dẫn/source trước D. Port 5173 chưa xác minh; Backend cấu hình 8000.
- Credentials chỉ lấy qua PAYOS_CLIENT_ID/PAYOS_API_KEY/PAYOS_CHECKSUM_KEY trong môi trường máy; không chép ảnh, không log secret, không commit. User cần thay khóa đã lộ trước khi kết nối thật.
- Local cần URL HTTPS công khai chuyển tiếp webhook, nhưng A không mở cổng/tunnel. Chỉ allow endpoint cần thiết; các API khác giữ xác thực. URL tạm thay đổi phải đăng ký lại sau này.
- Cần user xác nhận kênh có từng dùng tạo đơn hay dùng chung project khác không trước chọn orderCode; chưa cần khóa cho giai đoạn B1.
- Rollback code theo từng nhóm, giữ diff cũ của user. Không dùng reset --hard; không xóa bản ghi thanh toán đã tạo. Sau khi có giao dịch thật, ưu tiên tắt khởi tạo mới và giữ khả năng tiếp nhận/đối soát giao dịch đang chờ thay vì quay về code không hiểu PAYOS.
- DDL MySQL không thể dựa vào transaction rollback; schema cần backup và phương án riêng, không tự DROP để hoàn tác.

## Nguồn chính thức đã đối chiếu

- https://github.com/payOSHQ/payos-lib-java — SDK Java, ví dụ tạo link và verify webhook; README đang ghi 2.0.1. Chưa tải dependency để xác nhận tương thích với project.
- https://payos.vn/docs/api/ — create/get payment link, webhook và confirm webhook. Đây là API production; không gọi trong A.

## Bàn giao A

Chỉ tạo docs/PAYOS_STAGE_A_REVIEW.md. Không thay file nguồn, không cập nhật SQL đề xuất cũ. Chờ user duyệt B1, không triển khai liên tiếp B–E.
