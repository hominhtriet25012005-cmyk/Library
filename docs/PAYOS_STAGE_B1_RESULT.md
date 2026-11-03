# B1 — SDK, cấu hình và adapter payOS

Hoàn thành ngày 04/10/2026. Chỉ Backend. Frontend hoãn theo yêu cầu người dùng.

## Thay đổi

- Library/pom.xml: thêm vn.payos:payos-java:2.0.1. Chưa xóa Razorpay vì các caller cũ vẫn dùng.
- Library/src/main/resources/application.properties: payos.enabled mặc định false; các khóa lấy từ PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY. Không lưu khóa thật.
- Library/src/main/java/com/library/configrations/PayOSConfiguration.java: chỉ tạo bean khi bật; bật mà thiếu khóa thì báo lỗi tên cấu hình, không in giá trị. Giới hạn timeout và tắt retry SDK/connection tự động. Khởi tạo bean không gọi API.
- Library/src/main/java/com/library/service/gateway/PayOSService.java: adapter tạo link nhận số nguyên VND, giữ nguyên amount, không nhân 100; kiểm tra ID/amount dương, description và URL; trả response SDK có QR/link. Không truy cập repository, không kích hoạt gói, không đăng ký webhook.
- Library/src/test/java/com/library/PayOSConfigurationTests.java: 4 test cấu hình, không nạp application.properties hoặc DB.
- Library/src/test/java/com/library/PayOSServiceTests.java: 4 test adapter, input, lỗi; kiểm tra JSON ký bởi SDK thật qua HTTP interceptor chặn trước mạng với khóa giả. Response thành công được mock, chưa kiểm thử chữ ký response thành công/webhook.

## Kiểm chứng

- Test-first: lần đầu testCompile thất bại vì chưa có PayOSConfiguration/PayOSService (sau khi xử lý quyền đọc cache Maven).
- Lần chạy đầu sau implementation có lỗi fixture thiếu trường bin bắt buộc SDK; đã sửa fixture đầy đủ.
- Lần cuối: Maven 3.9.16, JDK 23 compile release 17, chạy offline với cache máy:

```text
mvn -o -Dmaven.repo.local=C:\Users\APC\.m2\repository clean compile -Dtest=PayOSConfigurationTests,PayOSServiceTests,StartupConfigurationTests test
BUILD SUCCESS
Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
```

- 134 source Java compile thành công; 8 test B1 và 5 test cấu hình cũ qua. Dùng Maven cached trực tiếp thay wrapper.
- git diff --check qua; còn cảnh báo LF/CRLF và cảnh báo Lombok cũ ở GenreDTO/ReservationSearchRequest, Mockito dynamic agent trên JDK 23.
- Không chạy toàn bộ test suite, CatalogMappingIT, SubscriptionPaymentMappingIT hay Spring Boot startup. Kết quả không chứng minh schema/CRUD/startup đã qua.
- Không gọi payOS production, không tạo đơn thật, không thay MySQL, không mở tunnel. Các thay đổi entity/test từ giai đoạn trước được giữ nguyên.

## Ranh giới bàn giao

Giữ PAYOS_ENABLED=false lúc này. Chưa cần khóa thật. Chưa có endpoint payOS và chưa thay đổi API/business flow Razorpay. B1 là nền tảng SDK, chưa phải thanh toán payOS hoạt động end-to-end.

B2 chỉ bắt đầu khi user yêu cầu: nối adapter vào tạo đơn VND, xác định orderCode duy nhất, chuyển DTO/mapping liên quan và xử lý timeout/đối soát. Không gộp SQL, webhook và frontend vào B1.

Trước nhận tiền thật phải hoàn thành webhook/quyền/idempotency, xử lý caller tiền phạt, kiểm tra schema và thay khóa đã lộ. Không bật B1 để nhận tiền thật khi chưa có các bước này.
