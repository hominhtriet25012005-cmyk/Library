# C2 — Thanh toán tiền phạt qua payOS và tháo Razorpay

Ngày 04/10/2026. Chỉ Backend. Không chỉnh schema/dữ liệu MySQL, không gọi payOS thật, không làm Frontend.

## Hành vi triển khai

- POST `/api/fines/{id}/pay`: chỉ chủ khoản phạt; số tiền = `amount - amountPaid` lấy từ DB dưới khóa hàng. Chấp nhận khoản phạt PENDING/PARTIALLY_PAID còn số dư dương; không nhận số tiền hay receipt do client tự khai. Query `transactionId` cũ nếu có nội dung sẽ bị từ chối.
- Payment liên kết đủ user/fine/bookLoan, gateway PAYOS, currency VND. Lưu đơn trước khi gọi gateway; dùng payment.id làm orderCode trên kênh riêng đã được user xác nhận.
- Dùng chung luồng tạo link/QR và gắn link của B2. Yêu cầu lặp không tạo đơn thay thế, kể cả đơn cũ chưa xác định kết quả. Timeout/không tìm thấy đơn cần đối soát riêng, không tự thử tạo lại.
- C1 xác minh chữ ký và truy vấn payOS, rồi phân luồng MEMBERSHIP/FINE. Với fine, khóa fine trước payment, refresh cả hai để tránh dữ liệu cũ; kiểm tra lại liên kết, số tiền, VND và receipt.
- Cộng `amountPaid`, cập nhật Fine PAID và Payment SUCCESS trong cùng transaction. Receipt giống nhau gửi lặp không cộng lần hai; khác receipt bị từ chối. Lỗi ghi Payment sau flush Fine phải rollback cả hai.
- Sửa `Fine.applyPayment()` vốn chỉ đổi status mà không cộng tiền. Hàm kiểm tra dương/không vượt số dư, dùng PARTIALLY_PAID có sẵn khi chưa đủ. Luồng payOS C2 chỉ thu toàn bộ số dư, không thêm chính sách trả góp.
- FineMapper trả các trường amountPaid/amountOutstanding vốn có trong DTO. PaymentDTO/mapper và API status bổ sung fineId; PaymentMapper trả bookLoanId. Không trả gatewaySignature.
- POST tạo/miễn phạt và GET toàn bộ tiền phạt chỉ ADMIN. Miễn phạt dùng khóa fine để phối hợp với thanh toán. Các API `/my` và thanh toán vẫn dành cho user đăng nhập, với kiểm tra owner tại store.
- FineController trả 400 cho tham số thanh toán sai, 403 cho truy cập trái quyền, 409 cho luồng đang không khả dụng/cần đối soát.

## Tháo gateway cũ

- Bỏ dependency, cấu hình và adapter Razorpay; bỏ DTO verify/link cũ và trường razorpayOrderId.
- POST `/api/payments/verify` trả HTTP 410, không ghi dữ liệu. Luồng activateSubscription legacy nội bộ từ chối; endpoint HTTP activate vẫn bị chặn như C1.
- Bỏ event publisher/listener cũ: không còn caller sau khi tháo Razorpay; payOS đã settlement đồng bộ trong transaction.
- Bỏ phương thức markFineAsPaid không có caller để không tồn tại đường đánh dấu thanh toán từ amount/receipt tùy ý.
- Tại thời điểm C2, enum gateway cũ tạm được giữ để chờ kiểm tra dữ liệu lịch sử. Đến DB-3 (31/10/2026), kiểm tra MySQL xác nhận chỉ có dữ liệu `PAYOS`, nên enum Java và CHECK database đã được thu hẹp còn duy nhất `PAYOS`; default database là `VND`.
- Các file gateway/DTO/event bị bỏ là mã nguồn, không phải dữ liệu thanh toán. File tracked có thể đối chiếu/khôi phục bản Git, nhưng bản Git không bao gồm mọi chỉnh sửa chưa commit trước đó; không dùng checkout/reset khi cần phục hồi vì có thể mất thay đổi khác.

## File thay đổi trong C2

Đường dẫn Java tính từ `Library/src/main/java/com/library/`.

| Nhóm | File | Lý do |
|---|---|---|
| Mới | service/impl/PayOSFineOrderStore.java, PayOSFineSettlementService.java | Tạo đơn và settlement fine dưới transaction/khóa |
| Service | service/impl/PaymentServiceImpl.java, PayOSMembershipPaymentService.java, PayOSConfirmationService.java | Routing payOS, tái sử dụng link, xác nhận fine |
| Fine | service/impl/FineServiceImpl.java, service/FineService.java, modal/Fine.java, mapper/FineMapper.java | Số dư, quyền, khóa khi waive, bỏ cập nhật thiếu bằng chứng |
| Repository | repository/FineRepository.java, PaymentRepository.java | Khóa fine và tìm đơn fine hiện có |
| API/security | controller/FineController.java, PaymentController.java, configrations/SecurityConfig.java | Quyền admin/owner, lỗi API, retire verify |
| Payment contract | modal/Payment.java, mapper/PaymentMapper.java, payload/dto/PaymentDTO.java, payload/response/PaymentInitiateResponse.java, payload/request/PaymentInitiateRequest.java | VND, liên kết fine/loan, bỏ trường gateway cũ |
| Legacy | service/PaymentService.java, service/impl/SubscriptionImpl.java | Bỏ verify và vô hiệu hóa activation legacy |
| Xóa mã nguồn | service/gateway/RazorpayService.java; payload/request/PaymentVerifyRequest.java; payload/response/PaymentLinkResponse.java; event/publisher/PaymentEventPublisher.java; event/listener/PaymentEventPublisher.java | Không còn caller, tránh đường thanh toán song song |
| Cấu hình | Library/pom.xml; Library/src/main/resources/application.properties | Bỏ SDK/config Razorpay; vẫn giữ payOS mặc định disabled |

Tests mới: FinePaymentTests, FinePayOSRoutingTests. Tests mở rộng: PayOSAtomicityTests, PayOSConfirmationTests, PayOSRepositoryQueryTests, configrations/PayOSHttpSecurityTests. StartupConfigurationTests thay bài test hai bean event đã xóa bằng test verify legacy HTTP 410 không gọi service. CatalogMappingIT cập nhật kỳ vọng default VND; không chạy phần integration MySQL.

## Kiểm chứng và giới hạn

- Áp dụng test-driven-development: test Fine ban đầu thất bại vì amountPaid không được cộng và overpayment/WAIVED chưa bị chặn; đã sửa và chạy lại.
- Self-review theo requesting-code-review tập trung liên kết owner/amount, transaction rollback, callback lặp, lock order và đường legacy; verification-before-completion yêu cầu build/test mới trên bản cuối.
- H2 in-memory riêng từng test, có kiểm thử tạo đơn đồng thời, callback đồng thời/replay, rollback, khoản phạt đã miễn, sai evidence và owner. Không phải bằng chứng tương đương hoàn toàn với MySQL locking/isolation/schema.
- Lệnh kiểm chứng dùng Maven cache 3.9.16, JDK 23 release17, offline:

```text
mvn -o -Dmaven.repo.local=C:\Users\APC\.m2\repository clean compile -Dtest=FinePayOSRoutingTests,FinePaymentTests,PayOSAtomicityTests,PayOSConfirmationTests,PayOSHttpSecurityTests,PayOSSettlementTests,MembershipVndTests,SubscriptionPayOSRoutingTests,PayOSMembershipTests,PayOSRepositoryQueryTests,PayOSConfigurationTests,PayOSServiceTests,StartupConfigurationTests test
```

Kết quả bản cuối lúc 18:25 ngày 04/10/2026: **BUILD SUCCESS**, compile 136 source files; **59 tests, 0 failures, 0 errors, 0 skipped** trong nhóm chọn phía trên. `git diff --check` exit 0. Đây không phải toàn bộ test suite. Còn cảnh báo Lombok cũ, Mockito/JDK dynamic agent và Hibernate pool/dialect dùng trong test.

## Chưa bật nhận tiền thật

- Chưa chạy toàn bộ test suite hoặc startup ứng dụng với MySQL. Không chạy CatalogMappingIT/SubscriptionPaymentMappingIT, không dùng khóa thật, không mở tunnel hay đăng ký webhook.
- Schema live chưa được xác minh lại: các điểm plan/CHECK PROCESSING và entity chặn startup trong báo cáo trước cần kiểm tra B0 riêng. C2 không tự thực thi SQL đề xuất.
- Nếu admin miễn phạt sau khi đã tạo QR mà khách vẫn chuyển tiền, hệ thống không tự đổi WAIVED thành PAID; cần đối soát thủ công. Không tự hoàn tiền/hủy link hoặc sửa chính sách miễn phạt.
- Thiếu/thừa tiền, nhiều receipt, receipt vượt độ dài cột Fine.transaction_id (100) không tự settle; cần kiểm tra riêng, không cắt receipt hay tự ALTER.
- Fine không có cột currency: C2 dùng VND theo yêu cầu project, không chuyển đổi số tiền lịch sử. Cần xác minh dữ liệu cũ đúng đơn vị trước khi bật production.
- Chưa tự retry/recreate các đơn lỗi/hết hạn; không thêm payout/refund/worker. Admin đọc trạng thái qua API hiện có; tự refresh giao diện thuộc Frontend sau này.
- Trước runtime thật: kiểm tra schema/startup, thay khóa đã lộ, cấu hình URL HTTPS webhook, rồi xin duyệt số tiền và dữ liệu thử. Dừng tại C2, không tự sang giai đoạn Frontend.
