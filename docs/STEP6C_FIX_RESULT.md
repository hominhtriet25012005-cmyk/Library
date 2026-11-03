# 6C — Kết quả sửa Reservation

05/10/2026, Asia/Saigon. **Đã sửa các lỗi xác nhận trong bộ kiểm chứng 6C**, bao gồm policy ngày mượn được người dùng duyệt: `min(14, maxDaysPerBook)`.

## Cập nhật cuối — 19:47:22

- ReservationServiceImpl inject SubscriptionService, lấy hạn mức của đúng chủ reservation; từ chối hạn mức null/không dương và đặt checkoutDays = min(14, hạn mức). Không đổi checkout thông thường hoặc quota của 6B.
- Step6ApiMySqlIT thêm assertion SQL DATEDIFF(due_date, checkout_date): gói 7 → 7 ngày; gói 30 → 14 ngày. ReservationAtomicityTests cập nhật constructor để dùng dependency membership của fixture.
- Hai ca policy chạy trước sửa: gói 7 còn fail HTTP 400, gói 30 đạt. Sau sửa: `clean compile test` **61/61 đạt**, gồm **19/19 API MySQL 6C + 33/33 API MySQL 6B + 3/3 Reservation atomicity H2 + 6/6 Loan atomicity H2**. 139 source / 22 test source compile thành công.
- Diff whitespace check đạt. JDBC read-only sau test xác nhận library_db1, 12 bảng đều 0 dòng; không đổi schema, không reset ID, không email/payOS thật.
- Chưa chạy lại full regression/package sau thay đổi policy cuối. Lượt package 80/80 bên dưới là trước thay đổi này; clean đã xóa JAR cũ, chưa tạo JAR mới. Không tuyên bố full suite hoặc HTTP/MySQL concurrency đã nghiệm thu.
- C-06 được xử lý; C-08 và các giới hạn 6G/6H vẫn còn. Không tự chuyển sang sửa 6D.

Các mục bên dưới giữ lịch sử lượt sửa trước khi người dùng chốt policy; thông tin “chờ quyết định” đã được thay thế bởi cập nhật trên. Test-driven-development dùng assertion ngày trả để chứng minh hành vi; verification-before-completion căn cứ lần chạy mới sau sửa.

## Thay đổi và lý do

| File trong Library/src | Thay đổi |
|---|---|
| main/java/com/library/configrations/SecurityConfig.java | Chỉ ADMIN được POST đặt hộ `/api/reservations/user/**`; giữ các rule hiện có |
| main/java/com/library/service/impl/ReservationServiceImpl.java | Kiểm tra owner/admin trước mutation; lưu đúng target user; chặn sách inactive, reservation terminal/hết hạn; gọi checkout thành công rồi mới FULFILLED; transaction rollback cả checked exception, READ_COMMITTED |
| main/java/com/library/service/impl/ReservationServiceImpl.java | Khóa user rồi book theo thứ tự checkout để bảo vệ quota và hàng đợi; refresh sau chờ khóa; cập nhật vị trí active queue theo reservedAt/id khi tạo/hủy/fulfill |
| main/java/com/library/repository/ReservationRepository.java | Query hàng đợi PENDING/AVAILABLE có thứ tự ổn định; không ALTER schema |
| main/java/com/library/exception/ReservationException.java | Lỗi nghiệp vụ riêng thay generic Exception ở các nhánh Reservation đã sửa |
| main/java/com/library/exception/ReservationExceptionHandler.java | Advice riêng Reservation: nghiệp vụ/loan/subscription → 400, quyền → 403; không che lỗi infrastructure bằng catch-all |
| test/java/com/library/Step6ApiMySqlIT.java | Thêm 3 ca: fulfill lặp, checkout thất bại không đổi status/inventory, resource không tồn tại |
| test/java/com/library/ReservationAtomicityTests.java | 3 ca H2 riêng, dùng lại fixture transaction của BookLoanAtomicityTests; kiểm tra rollback sau loan đã flush và thao tác cạnh tranh |

Không sửa source loan/plan/payment/auth khác; giữ các thay đổi cũ trong workspace. Không đổi default 14 ngày, không nới quota membership, không thêm notification/scheduler/endpoint hoặc luật ưu tiên fulfill mới. Giữ quy tắc chặn CHECKED_OUT đang có; xử lý OVERDUE khi đặt trước còn cần nghiệm thu riêng.

## Bằng chứng mới

- Trước sửa, 19:35:09: 16 ca MySQL = 5 đạt, 7 failures, 4 errors, tái hiện đúng báo cáo cũ.
- Sau nhóm sửa đầu, 19:36:55: 16 ca = 15 đạt, 1 failure, không error. Ca còn lại gói 7 ngày nhận HTTP 400 thay kỳ vọng 200 vì default checkout 14 ngày.
- Sau bổ sung test và review cuối, **19:39:55**: `clean compile test` compile 139 source / 22 test source thành công; **52 ca API MySQL gồm 33 ca 6B đạt + 18/19 ca 6C đạt**. Đồng thời **6/6 BookLoanAtomicityTests và 3/3 ReservationAtomicityTests H2 đạt**. Lệnh tổng BUILD FAILURE đúng 1 assertion còn mở, không phải compile lỗi.
- XML phiên tổng: `Library/target/surefire-reports/TEST-com.library.Step6ApiMySqlIT.xml`; XML atomicity cùng thư mục. Maven clean đã xóa artifact và XML cũ trong target; báo cáo Markdown cũ giữ lịch sử.
- Test H2 mới chứng minh: reservation save lỗi sau checkout flush rollback loan/inventory/status; đặt trùng đồng thời chỉ một reservation; fulfill đồng thời chỉ một loan. Đây **không** phải MySQL concurrency/HTTP commit production.

## Chính sách đang chờ người dùng

Hồi quy/package cuối lúc **19:40:46: 80/80 test đạt, BUILD SUCCESS**; lượt này loại Step6ApiMySqlIT nên không thay kết quả 1 ca API còn fail. JAR mới chưa chạy standalone. JDBC read-only sau test: đúng library_db1, 12 bảng đều 0 dòng; không còn fixture, không reset ID. Diff check không báo lỗi whitespace. Một lệnh Maven phụ chạy nhầm thư mục gốc đã lỗi không có pom, được chạy lại đúng thư mục Library; không phải lỗi source.

Đã hỏi: khi fulfill không có input ngày, có dùng `min(14, maxDaysPerBook)` không? Ví dụ gói 7 → 7 ngày, gói 30 → 14 ngày. Chưa áp dụng khi chưa có câu trả lời; không sửa test thành xanh bằng cách đổi kỳ vọng cho qua. `ownerReservationFulfillCreatesLoan` vẫn giữ kỳ vọng 200 và đang fail 400.

Sau khi chốt sẽ bổ sung assertion dueDate cho cả gói ngắn/dài, sửa đúng policy và chạy lại 6B/6C. Không chuyển 6D lúc này.

## Giới hạn

MySQL tests dùng MockMvc, guard đúng library_db1 và toàn bộ bảng rỗng trước fixture, transaction rollback. Không gửi email hoặc gọi payOS, không đổi schema, không reset AUTO_INCREMENT. Chưa nghiệm thu mọi quota/ưu tiên queue, nhiều user khác nhau cạnh tranh queue/quota, toàn bộ pagination, commit/race MySQL. C-08 và 6G/6H còn mở.

Đã áp dụng systematic-debugging, test-driven-development và verification-before-completion; review diff tập trung quyền, thứ tự mutation/locks, rollback và không đổi business rule chưa được quyết định. Các test bổ sung là regression sau fix; test đỏ 16 ca đã tồn tại và được tái hiện trước fix.
