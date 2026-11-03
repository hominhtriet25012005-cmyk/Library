# B2 — Tạo đơn thành viên payOS/VND (Backend)

Ngày: 04/10/2026. Đã triển khai code và kiểm thử offline; CHƯA bật nhận tiền thật.
Người dùng xác nhận kênh payOS mới, dành riêng cho project, chưa tạo đơn hoặc dùng chung hệ thống khác.

## Kết quả

- POST /api/subscriptions/subscribe chuyển tạo đơn thành viên mới sang PAYOS. Lấy user từ phiên đăng nhập; bỏ qua userId/price/currency do client gửi và từ chối subscription ID đầu vào khi tạo mới.
- Chỉ dùng plan active. Plan price Java/DTO dùng BigDecimal theo DECIMAL(10,2); mapper từ chối phần lẻ dưới đồng, giá không dương hoặc vượt độ rộng cột. Subscription chụp price số nguyên chính xác và currency VND.
- payment.id đã commit làm orderCode. Không dùng timestamp theo giây. Kênh phải tiếp tục dành riêng cho project; không reset ID/khôi phục DB cũ vào kênh đang nhận tiền nếu chưa đối soát các mã đơn.
- Ghi rõ VND trên từng payment payOS; không nhân 100 và không đổi nhãn dữ liệu INR lịch sử. Payment default INR/luồng fine cũ tạm giữ đến C2 để không âm thầm thay đơn vị luồng Razorpay.
- Tách transaction DB ngắn (REQUIRES_NEW) khỏi I/O gateway. Khóa user để tái sử dụng draft cùng plan đang chờ; khóa subscription để cùng draft chỉ chuẩn bị một payment; attach link khóa payment và không ghi đè trạng thái cuối.
- Payload phản hồi thêm orderCode, paymentLinkId, qrCode, currency, status; giữ các trường cũ để không xóa hợp đồng API trong nhóm này. transactionId của payOS là mã nội bộ ổn định.
- success=true trong tạo link chỉ nghĩa tạo link thành công, KHÔNG phải tiền đã nhận. Không kích hoạt gói hay ghi SUCCESS trong luồng mới B2.
- Mất kết nối/response không khớp/lỗi lưu link: giữ payment đã commit để đối soát; thông báo ID nội bộ, không lộ raw error SDK. Không tự retry tạo link hoặc tự ghi FAILED.
- Gọi lặp cho draft đang chờ sẽ tìm lại cùng orderCode bằng GET payOS, không POST tạo đơn mới. Trong B2 trả success=false và thông báo cần xác minh; chưa trả lại QR/link hoặc hoàn tất thanh toán khi lookup. Khả năng phục hồi khi process chết trước POST/lookup 404 và quyết định retry có kiểm soát thuộc bước đối soát C1, không tự tạo đơn thay thế.
- Verify Razorpay cũ không được xác nhận payment PAYOS. Razorpay vẫn còn cho caller fine và dữ liệu cũ; chỉ chỉnh phép so sánh giá BigDecimal để compile và giữ nhánh cũ.

## Cấu hình

```properties
payos.enabled=${PAYOS_ENABLED:false}
payos.creation-enabled=${PAYOS_CREATION_ENABLED:false}
payos.return-url=${PAYOS_RETURN_URL:}
payos.cancel-url=${PAYOS_CANCEL_URL:}
```

Giữ cả hai cờ false trong môi trường hiện tại. Chưa có URL Frontend xác minh nên return/cancel URL để trống mặc định, lấy từ cấu hình server khi triển khai sau; không dùng URL do client tùy ý gửi. Khi cổng bị tắt, subscribe bị chặn trước khi tạo draft, không tự quay về Razorpay.

## File thay đổi trong B2

Các đường dẫn Java dưới đây nằm trong Library/src/main/java/com/library/.

| File | Lý do |
|---|---|
| domain/PaymentGateway.java | Thêm PAYOS, giữ giá trị lịch sử |
| modal/SubscriptionPlan.java; payload/dto/SubscriptionPlanDTO.java | BigDecimal/precision giá plan và validation |
| modal/Subscription.java | Snapshot giá whole-VND chính xác, gán currency |
| mapper/SubscriptionPlanMapper.java | Kiểm tra giá và tiền tệ khi tạo/cập nhật plan |
| mapper/SubscriptionMapper.java | Không nhận ID mới từ client, trả currency |
| mapper/PaymentMapper.java; payload/dto/PaymentDTO.java | Trả currency payment |
| payload/response/PaymentInitiateResponse.java | Trường trung lập cho đơn payOS, QR và trạng thái |
| repository/UserRepository.java; SubscriptionRepository.java; PaymentRepository.java | Lock/query tái sử dụng draft và payment |
| service/impl/PayOSOrderStore.java (mới) | Transaction chuẩn bị draft/payment và lưu link |
| service/impl/PayOSMembershipPaymentService.java (mới) | Điều phối gọi gateway/đối chiếu response/xử lý lỗi và lookup đơn cũ |
| service/impl/SubscriptionImpl.java | Dùng user đăng nhập, chuyển đăng ký sang luồng mới |
| service/impl/PaymentServiceImpl.java | Dispatch PAYOS membership, chặn gateway không hỗ trợ và verify chéo gateway |
| service/gateway/PayOSService.java | Lookup orderCode, tái sử dụng kiểm tra URL |
| service/gateway/RazorpayService.java | Tương thích giá BigDecimal, chưa gỡ caller fine |
| Library/src/main/resources/application.properties | Cờ khóa tạo đơn và URL server-configured |

Tests mới trong Library/src/test/java/com/library/:

- MembershipVndTests.java: giá .00, số lẻ/âm/0/tràn, precision plan, currency, mapper không tin client.
- PayOSMembershipTests.java: cổng tắt, tạo link, timeout, response sai, lookup lặp, chủ sở hữu, snapshot, draft active/inactive và tái sử dụng.
- SubscriptionPayOSRoutingTests.java: đường subscribe dùng user server và PAYOS, từ chối ID đầu vào.
- PayOSRepositoryQueryTests.java: Hibernate parse các JPQL mới với metadata entity, không mở JDBC connection, không DDL.

## Kiểm chứng thực tế đã chạy

- Test-first MembershipVndTests thất bại ban đầu vì entity còn Long, sau đó đổi sang BigDecimal và test qua.
- mvn clean compile thành công, 136 source files, JDK 23 compile release 17.
- Lượt cuối với Maven cached 3.9.16 và offline:

```text
mvn -o -Dmaven.repo.local=C:\Users\APC\.m2\repository -Dtest=MembershipVndTests,SubscriptionPayOSRoutingTests,PayOSMembershipTests,PayOSRepositoryQueryTests,PayOSConfigurationTests,PayOSServiceTests,StartupConfigurationTests test
Tests run: 29, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- 16 test B2 + 13 test B1/cấu hình cũ. git diff --check qua.
- Cảnh báo cũ Lombok/Mockito vẫn còn. Hibernate warning dialect trong test là do cố ý chọn dialect để không truy vấn JDBC metadata.
- Không chạy full suite, startup toàn ứng dụng, CatalogMappingIT, SubscriptionPaymentMappingIT hay giao dịch MySQL. Test mock không chứng minh transaction/khóa đồng thời đúng trên MySQL; JPQL offline không chứng minh schema live khớp.
- Không sửa/chạy SQL, không gọi API production, không tạo đơn thật, không mở tunnel, không sửa Frontend. Giữ thay đổi cũ của người dùng.

## Chưa sẵn sàng nhận tiền thật

1. Schema plan và CHECK PROCESSING cần kiểm tra live và phê duyệt DDL riêng nếu còn thiếu. Không tự chạy stage4_schema_proposal.sql.
2. C1 còn phải triển khai webhook signature, finalize payment/quyền lợi một transaction, bảo vệ API activate/admin/cancel cũ, xử lý thông báo trùng/đến sớm và đối soát timeout/404/đơn đã paid. B2 không sửa hết các lỗ hổng security đã báo ở A.
3. C2 xử lý fine, gỡ Razorpay và thống nhất default tiền tệ mới sau kiểm tra dữ liệu.
4. Trước bật cổng: thay khóa đã lộ, cấu hình URL, chạy startup/schema + transaction/concurrency integration tests và được user duyệt giao dịch thử thật.
5. Frontend hoãn. QR trả về là dữ liệu QR, không phải hình ảnh/màn hình đã triển khai.

Kết luận: B2 hoàn thành phạm vi tạo đơn/DTO/mapping với kiểm thử offline; thanh toán end-to-end và phục hồi tự động chưa hoàn thành. Dừng để người dùng kiểm soát bước tiếp theo.
