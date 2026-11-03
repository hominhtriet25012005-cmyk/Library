# 6B — Kết quả sửa Mượn / Trả / Gia hạn

Ngày 05/10/2026, Asia/Saigon. **Đã sửa các lỗi xác nhận của 6B; 33/33 ca API MySQL và 6/6 ca transaction H2 đạt.** Không coi đây là chứng nhận mọi luồng Backend hoặc test tải MySQL production.

## Những gì đã sửa

| Phần | File trong Library/src/main/java/com/library | Thay đổi |
|---|---|---|
| Quyền | configrations/SecurityConfig.java | ADMIN cho checkout/user/**, search quản trị, admin/update-overdue; giữ checkout bản thân, checkin/renew cho chủ sở hữu hoặc admin |
| Quyền và tồn kho | service/impl/BookLoanServiceImpl.java | Kiểm tra owner/admin tại service; khóa user để tuần tự hóa quota, khóa book/loan và refresh trạng thái sau khi chờ khóa; transaction rollbackFor Exception, READ_COMMITTED để quota không dùng snapshot cũ khi chờ |
| Membership đúng người | service/impl/SubscriptionImpl.java | Query userId mục tiêu, chỉ owner/admin được đọc; userId null giữ ý nghĩa người hiện tại |
| Ngày mượn/gia hạn | service/impl/BookLoanServiceImpl.java | Validate ngày dương, checkout không vượt maxDaysPerBook; reject ngày gia hạn vượt phạm vi DATE MySQL; pagination lỗi trả 400 |
| Trả sách | service/impl/BookLoanServiceImpl.java | Chỉ RETURNED/LOST/DAMAGED; khóa chống trả lặp; từ BE-1 chỉ RETURNED nhập kho, DAMAGED/LOST không nhập kho; giữ lịch sử quá hạn và nối ghi chú cũ; kiểm tra available không vượt total |
| Quá hạn | modal/BookLoan.java; repository/BookLoanRepository.java | canRenew và kiểm tra khoản quá hạn xét dueDate thực tế, không chỉ chờ job cập nhật flag |
| Job quá hạn | service/impl/BookLoanServiceImpl.java | Lưu overdueDays và cập nhật khoản đã OVERDUE, đọc lại trạng thái dưới khóa trước sửa |
| Repository khóa | repository/BookRepository.java; repository/BookLoanRepository.java | Thêm query PESSIMISTIC_WRITE; dùng lại UserRepository.findLockedById đã tồn tại |
| Request | payload/request/{CheckoutRequest,RenewRequest,CheckinRequest,BookLoanSearchRequest}.java | Bỏ all-args constructor để JSON dùng no-args/default; ngày null bị validation chặn, notes tối đa 500; field JSON vẫn là checkoutDays/extensionDays |
| Response lỗi | exception/BookLoanExceptionHandler.java (mới) | Advice riêng BookLoanController: BookException/SubscriptionException → 400; input/date không hợp lệ → 400 thông báo an toàn; không catch-all hoặc đổi lỗi của Reservation |

Không đổi schema, không thêm scheduler, không tính phạt tự động hoặc chuyển hàng đợi reservation. Không đổi mặc định 14 ngày/2 lần gia hạn: nếu default checkout 14 vượt gói 7 thì trả 400, client phải chọn ngày phù hợp. Không tự đặt thêm policy giới hạn gia hạn theo membership hết hạn. Job vẫn giữ batch tối đa 1000 như trước.

## Kiểm chứng

Áp dụng kế hoạch ba đợt (quyền/error → policy/state → atomicity), systematic-debugging, test-first từ 25 ca đỏ đã có và verification-before-completion. Tự review diff theo requesting-code-review: quyền kiểm tra trước mutation loan; khóa quota và tồn kho; rollback cả checked exception; không thay source Reservation; giữ các thay đổi JWT/auth khác đang có sẵn trong workspace.

1. `clean compile ... test`: 137 source compile thành công, 25/25 ca loan ban đầu đạt lúc 14:38:40.
2. Bổ sung ca admin renew/return DAMAGED, terminal status, null/notes, missing ID, cập nhật overdue lần sau, search defaults/pagination, privacy membership target và ngày cực lớn.
3. Lần cuối lúc **14:44:51: 39 tests, 0 failures/errors/skipped**, gồm 33 MySQL API + 6 H2 transaction. Báo cáo MySQL riêng: `Library/target/step6b-mysql-final.xml`.
4. Hồi quy/package lúc **14:48:21: 77 tests, 0 failures/errors/skipped, BUILD SUCCESS**. Có loại Step6ApiMySqlIT khỏi lượt package; đây không phải toàn bộ test API đạt. Bao gồm 71 test hồi quy/unit cũ + 6 atomicity mới.

Test mới `src/test/java/com/library/BookLoanAtomicityTests.java` dùng Hibernate/JPA + Spring transaction proxy và database H2 in-memory duy nhất mỗi test. Mock UserService/SubscriptionService chỉ cung cấp actor/quota, repository/transaction thật. Sáu tình huống: insert loan lỗi sau flush inventory; return lỗi sau flush; hai borrower giành bản cuối; một borrower mượn hai sách khi quota=1; hai request trả cùng loan; hai request gia hạn khi còn một lượt. Không tác động MySQL chính. Harness ban đầu lỗi cấu hình JPA dialect/isolation đã được sửa để dùng HibernateJpaDialect/connection handling phù hợp; lần cuối tất cả đạt.

Lệnh kiểm tra 6B từ Library:

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=BookLoanAtomicityTests,Step6ApiMySqlIT#loan*+checkout*+duplicateCheckout*+crossUserCheckin*+crossUserRenew*+adminCheckout*+memberCannotCheckout*+memberCannotSearchAllLoans+memberCannotRunOverdueAdminJob+overdueAdminJobStoresDayCount+checkinCannotLeaveLoanCheckedOut' '-Dstep6.mysql=true' test
```

Package/hồi quy:

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=*Tests,*IT,!Step6ApiMySqlIT' '-Dspring.jpa.hibernate.ddl-auto=validate' '-Dspring.sql.init.mode=never' '-Dapp.initialize-admin=false' '-Dpayos.enabled=false' '-Dpayos.creation-enabled=false' '-Dspring.datasource.hikari.read-only=true' '-Dspring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=ON' '-Dspring.jpa.show-sql=false' package
```

JAR SHA-256: `99a6995cae5f56dbf719c6bd4a21c5367efa6090ee75e494ac7fd52e9f731239`. Giữ artifact nội bộ, không upload cấu hình nhạy cảm. Chưa chạy lại standalone JAR mới; context/DI/JPA đã khởi tạo trong test. Giữ cảnh báo Lombok/Mockito/open-in-view hiện hữu.

## Giới hạn và dữ liệu

- API MySQL chạy MockMvc với transaction test rollback, không commit thật qua HTTP. Transaction/race đã kiểm chứng trên H2 riêng, chưa phải MySQL concurrency thực tế. Các phần này vẫn thuộc nghiệm thu 6G/6H khi đủ môi trường.
- Chưa kiểm thử mọi tổ hợp loan search filters, quá 1000 khoản overdue hoặc ảnh hưởng từ catalog/payment cập nhật đồng thời. Không mở rộng kết luận từ bộ test này.
- BE-1 ngày 31/10/2026 đã giữ lịch sử overdue và ghi chú khi trả. Vẫn chưa thêm tính tiền phạt tự động hoặc tự chuyển lượt reservation; các phần đó thuộc nhóm riêng.
- JDBC READ ONLY sau 6B/6C và hồi quy: library_db1, MySQL 9.2.0, 12 bảng đều 0 dòng. Fixture rollback, AUTO_INCREMENT có thể tăng; không reset. Email mock, payOS disabled.
- 6C được kiểm tra tiếp, chưa sửa: xem [báo cáo 6C](STEP6C_RESERVATION_REVIEW.md). Reservation dùng default checkout 14 nên fail đúng policy mới khi gói chỉ cho 7; không nới 6B để bỏ qua vấn đề tích hợp này.
