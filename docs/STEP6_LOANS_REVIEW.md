# Bước 6 — Kiểm tra riêng Mượn / Trả / Gia hạn

05/10/2026, Asia/Saigon. **Chỉ kiểm tra; chưa sửa nghiệp vụ. Nhóm chưa đạt nghiệm thu.**

**Lưu ý lịch sử:** báo cáo dưới đây là trước sửa. Các lỗi xác nhận đã được xử lý sau đó; xem [kết quả sửa 6B](STEP6B_FIX_RESULT.md) để biết trạng thái mới nhất và giới hạn nghiệm thu.

## Phạm vi và cách chạy

Đối chiếu BookLoanController, BookLoanServiceImpl, BookLoanRepository, BookLoan/Book, DTO/mapper/request, SecurityConfig, SubscriptionImpl/Repository và tài liệu Library_Management_System_VI.md (Book Loan).

Tái sử dụng 13 ca loan có sẵn trong workspace, bổ sung 12 ca loan vào Step6ApiMySqlIT, không chỉnh/xóa các test module khác. Áp dụng verification-before-completion để lấy bằng chứng mới và systematic-debugging để đối chiếu exception/nguồn lỗi. Không chạy toàn bộ class có các test ngoài nhóm.

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=Step6ApiMySqlIT#loan*+checkout*+duplicateCheckout*+crossUserCheckin*+crossUserRenew*+adminCheckout*+memberCannotCheckout*+memberCannotSearchAllLoans+memberCannotRunOverdueAdminJob+overdueAdminJobStoresDayCount+checkinCannotLeaveLoanCheckedOut' '-Dstep6.mysql=true' test
```

Test compile thành công, Spring context/Hikari/JPA validate khởi tạo thành công. Kết thúc **07:50:01: 25 tests, 10 failures, 11 errors, 4 pass, 0 skipped; BUILD FAILURE** do các test phát hiện lỗi. Đây không phải 21 lỗi độc lập; nhiều ca cùng thất bại do thiếu handler lỗi nghiệp vụ.

MVC filter/security/controller/service/repository thật, MySQL library_db1 thật; không HTTP qua socket. Mỗi test rollback. Guard xác nhận mọi bảng rỗng trước chèn fixture. Membership được tạo trực tiếp phục vụ điều kiện test, không phải xác nhận thanh toán. EmailService mock; payOS/init/DDL tự động tắt. Job overdue chỉ được gọi khi database rỗng và chỉ có fixture trong transaction.

## Checklist 25 ca thực chạy

| # | Tình huống | Kết quả | Bằng chứng / phân biệt |
|---|---|---|---|
| 1 | Mượn → query → gia hạn → trả bình thường | ĐẠT | 201/200, tồn kho 2→1→2, renewal_count=1, status RETURNED |
| 2 | Trả LOST | ĐẠT | Status LOST, không tăng available_copies |
| 3 | /my cách ly người dùng + lọc trạng thái | ĐẠT | Chủ sở hữu thấy 1 khoản; user khác thấy 0 |
| 4 | Số ngày 0, thiếu loanId, enum không hợp lệ | ĐẠT | 400 từ validation/deserialization |
| 5 | Không membership | LỖI RESPONSE | Service đã chặn nhưng SubscriptionException thoát khỏi MVC, không trả 4xx có kiểm soát |
| 6 | Membership hết hạn | LỖI RESPONSE | Cùng lỗi handler; không phải đã cho mượn sai |
| 7 | Sách hết bản | LỖI RESPONSE | BookException đúng nhánh kiểm tra, không được map 4xx |
| 8 | Sách inactive | LỖI RESPONSE | BookException không được map 4xx |
| 9 | Mượn trùng sách đang mượn | LỖI RESPONSE | Service đã chặn, BookException không được map 4xx |
| 10 | Đủ hạn mức số sách | LỖI RESPONSE | Service đã chặn, Exception không được map 4xx |
| 11 | Trả lặp khoản đã RETURNED | LỖI RESPONSE | Service đã chặn, BookException không được map 4xx; assertion tồn kho sau response chưa chạy vì exception |
| 12 | Gia hạn khi đủ 2 lần | LỖI RESPONSE | canRenew chặn, BookException không được map 4xx |
| 13 | Mượn 60 ngày trong gói maxDaysPerBook=7 | LỖI NGHIỆP VỤ | Trả 201, không áp dụng hạn mức ngày |
| 14 | Thiếu checkoutDays | LỖI VALIDATION/DEFAULT | getCheckoutDays() null gây NPE, không dùng default hoặc trả 4xx |
| 15 | Thiếu extensionDays | LỖI VALIDATION/DEFAULT | getExtensionDays() null gây NPE |
| 16 | User khác trả khoản mượn | LỖI QUYỀN | Trả 200 thay 403 |
| 17 | User khác gia hạn khoản mượn | LỖI QUYỀN | Trả 200 thay 403 |
| 18 | Member mượn hộ user khác không có membership | LỖI QUYỀN/MEMBERSHIP | Trả 201 thay 403; dùng membership người gọi |
| 19 | Admin cho user có membership mượn (admin không có gói) | LỖI MEMBERSHIP | Báo no active subscription vì kiểm tra admin thay người mượn |
| 20 | Member truy vấn /search toàn bộ loan | LỖI QUYỀN | Trả 200 thay 403; source không giới hạn theo chủ sở hữu |
| 21 | Member chạy /admin/update-overdue | LỖI QUYỀN | Trả 200 thay 403 |
| 22 | Job overdue lưu số ngày trễ | LỖI DỮ LIỆU | Status OVERDUE nhưng overdue_days=0 thay vì 2 |
| 23 | Trả với condition=CHECKED_OUT | LỖI TRẠNG THÁI | API chấp nhận 200 thay 4xx, vẫn active dù đã trả; source còn cộng tồn kho |
| 24 | Gia hạn khoản đã qua dueDate nhưng chưa chạy job | LỖI NGHIỆP VỤ | 200, canRenew chỉ xét status/isOverdue cũ |
| 25 | Mượn mới khi có khoản qua dueDate chưa chạy job | LỖI NGHIỆP VỤ | 201, query chỉ đếm status OVERDUE |

Errors của MockMvc là request exception không được resolve; chưa đo status HTTP qua Tomcat cho các ca này, không khẳng định đã quan sát 500 qua socket.

## Các nguyên nhân và đề xuất (chưa thực hiện)

| Priority | Component | File/Table | Problem / Cause | Proposed Fix |
|---|---|---|---|---|
| HIGH | Authorization | SecurityConfig; BookLoanServiceImpl.checkinBook/renewCheckout/getBookLoans | Loan routes chỉ authenticated; checkin/renew không kiểm tra user sở hữu | ADMIN cho checkout hộ/search quản trị/job; check owner hoặc ADMIN trước mutation. Kiểm thử quyền và dữ liệu không đổi khi từ chối |
| HIGH | Membership | SubscriptionImpl:66–70 | Tham số userId bị bỏ qua, query người đang đăng nhập | Query đúng target sau kiểm tra quyền; đánh giá ảnh hưởng các caller trước sửa |
| HIGH | Checkout policy | BookLoanServiceImpl:98 | checkoutDays không so với subscription.maxDaysPerBook | Áp dụng hạn mức và xử lý default/null theo policy đã xác nhận |
| HIGH | Return state | BookLoanServiceImpl:136–150 | Nhận mọi enum BookLoanStatus làm condition; CHECKED_OUT/OVERDUE vẫn active nhưng tăng tồn kho | Chỉ nhận trạng thái trả hợp lệ theo contract, bảo đảm trả không bị áp dụng hai lần |
| HIGH | Overdue policy | BookLoan.canRenew; BookLoanRepository.countOverdueBookLoansByUser | Dựa vào flag/status có thể chưa được job cập nhật | Tính quá hạn bằng dueDate tại thời điểm kiểm tra; giữ status phù hợp |
| MEDIUM | Overdue data | BookLoanServiceImpl:261 | Tính biến overdueDays nhưng không set lên entity; các khoản đã OVERDUE không được cập nhật thêm ngày | Set và cập nhật số ngày trễ theo policy; kiểm tra trước/sau job |
| MEDIUM | API errors | GlobalException; BookException/SubscriptionException và Exception trong loan service | Thiếu mapping exception sang response có kiểm soát | Exception nghiệp vụ có kiểu rõ, handler 4xx không lộ dữ liệu; tránh catch-all che lỗi hệ thống |
| MEDIUM | Request defaults | CheckoutRequest/RenewRequest | Giá trị default không có khi deserialize request thiếu field; @Min bỏ qua null | Quy định rõ omitted/null: default hoặc reject; test cả hai trường hợp |

Không thấy cần ALTER schema để sửa các lỗi xác nhận ở trên.

## Rủi ro từ đọc code — chưa tái hiện bằng commit/concurrency thật

- Checkout/checkin cập nhật books và book_loans qua hai save, service không có transaction bao toàn bộ. Nếu save loan thất bại sau save book, có nguy cơ lệch tồn kho. Transaction bao ngoài test che tình huống này; **chưa khẳng định đã tái hiện partial commit**.
- Chưa thấy optimistic version/pessimistic lock cho đường loan. Có nguy cơ hai request giành bản cuối hoặc trả/gia hạn đồng thời; **chưa chạy race trên database chính**.
- Trả trễ đang reset overdueDays/isOverdue và phần fine là TODO; cần xác nhận chính sách lưu lịch sử/ngày trễ/tính phạt trước sửa, không tự thêm tính năng.
- Tài liệu dùng dueDays/extendDays và liệt kê một số endpoint chưa có trong controller; code đang nhận checkoutDays/extensionDays. Test dùng field thực của Backend; cần đồng bộ tài liệu riêng, không tự thêm endpoint từ tài liệu.

## Chưa kiểm tra hết trong nhóm này

- Commit thực qua HTTP, inject lỗi giữa các save, cạnh tranh nhiều request.
- Return DAMAGED, admin trả/gia hạn thay người khác, renew trạng thái RETURNED/LOST/OVERDUE; input null tường minh, số cực lớn, notes quá dài, ID không tồn tại và mọi tổ hợp filter/search/pagination.
- Tính phạt trả trễ và tự chuyển reservation tiếp theo; chính sách ngày gia hạn khi membership hết hạn cần xác nhận.

Đợt này là lượt kiểm tra 25 ca chính, **không phải chứng nhận toàn bộ module đã được bao phủ**. Không sửa source nghiệp vụ. Chỉ bổ sung test và báo cáo/README. Không tự chuyển sang kiểm tra module tiếp theo hoặc sửa các vấn đề vừa tìm thấy.

## Dữ liệu sau kiểm tra

JDBC READ ONLY độc lập sau test: đúng library_db1, MySQL 9.2.0, 12 bảng đều 0 bản ghi. Không thay schema, không để lại fixture. AUTO_INCREMENT có thể tăng; không reset. Không gửi email, nhận tiền hoặc gọi provider thật. `git diff --check` không lỗi. Báo cáo máy tại Library/target/surefire-reports/TEST-com.library.Step6ApiMySqlIT.xml; chỉ phản ánh bộ chọn loan của lần chạy này và có thể bị ghi đè ở lần test sau.
