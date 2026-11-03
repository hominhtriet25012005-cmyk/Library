# Bước 6 — Bảng đối chiếu tài liệu–code–test

Cập nhật: 05/10/2026. Phạm vi: Backend và MySQL; không Frontend, không giao dịch thật.

**Cập nhật cuối 19:47:22:** xem [kết quả 6C](STEP6C_FIX_RESULT.md). Người dùng đã duyệt min(14, hạn mức gói); đã áp dụng và kiểm tra SQL hạn trả 7/14 ngày. **19/19 ca API 6C + 33/33 API 6B + 9/9 atomicity H2 đạt**. C-01–C-07 đạt phạm vi ca đã chạy; C-08 chưa phủ đầy đủ, 6G/6H còn mở. Những kết quả 5/16 và “chưa sửa” ở bảng chi tiết bên dưới là mốc review trước sửa, giữ để truy vết.

**Cập nhật 6D (20:24:37):** xem [kết quả triển khai Review](STEP6D_RESULT.md). Sáu API test Review và 80 regression/package test đạt sau mapping soft delete; JAR package thành công.

**Cập nhật 6E (20:35:55):** xem [kết quả quên/reset password](STEP6E_RESULT.md). Tám API MySQL và 80 regression/package test đạt; email được mock, schema không đổi.

**Cập nhật 6A (21:12:30):** xem [kết quả triển khai 6A](STEP6A_RESULT.md). 21 API test MySQL và 72 regression/package test đạt; search `{}` an toàn, password profile ẩn, danh sách user chỉ ADMIN theo lựa chọn người dùng.

Đây là sổ theo dõi nghiệm thu, **không phải xác nhận toàn bộ Backend đã đúng tài liệu**. Lượt lập bảng chỉ đọc source, tài liệu và báo cáo đã lưu; không chạy lại test, không thay Backend/schema/dữ liệu. Kết quả cũ không bảo đảm mọi thay đổi workspace sau đó đã được kiểm chứng.

## 1. Cách đọc và nguồn bằng chứng

- **Đạt giới hạn**: ca đã chạy đạt; chỉ áp dụng đúng phạm vi ca đó.
- **Lỗi đã xác nhận**: có kết quả chạy không đạt; nhiều ca có thể chung một nguyên nhân.
- **Có test / chưa nghiệm thu**: source test tồn tại nhưng chưa có bằng chứng chạy đạt cho nhóm Bước 6 này.
- **Chưa phủ**: cần bổ sung kiểm tra; không đồng nghĩa đã xác nhận lỗi.
- **Lệch hợp đồng / cần quyết định**: tài liệu khác code hoặc test; không tự chọn bên nào đúng.
- **Đã đổi theo yêu cầu**: payOS/VietQR/VND thay yêu cầu gateway/tiền tệ cũ; không khôi phục Razorpay để khớp tài liệu.

Nguồn:

| Ký hiệu | Nguồn | Giá trị chứng minh |
|---|---|---|
| D | [Tài liệu gốc](Library_Management_System_VI.md) | Số dòng ghi trong bảng là vị trí ở bản hiện tại; bao gồm 12 module |
| T | [Step6ApiMySqlIT.java](../Library/src/test/java/com/library/Step6ApiMySqlIT.java) | Test qua MockMvc/security/service/repository và MySQL, transaction test rollback; không phải HTTP socket/commit production |
| A | [Nhóm 1](STEP6_GROUP1_RESULT.md), [nhóm 2](STEP6_GROUP2_RESULT.md) | Kết quả lịch sử 6A: sau nhóm 2, bộ chọn 17 ca có 16 đạt, 1 error search rỗng |
| B | [Kết quả sửa 6B](STEP6B_FIX_RESULT.md), `Library/target/step6b-mysql-final.xml` | 33 ca MySQL đạt; 6 ca H2 transaction đạt riêng |
| C | [Review 6C](STEP6C_RESERVATION_REVIEW.md), `Library/target/step6c-reservations-review.xml` | 16 ca: 5 đạt, 7 assertion failures, 4 errors |
| R | `Library/target/surefire-reports/TEST-*.xml`, [README](../Library/README.md) | 77 test hồi quy/package đạt ở lượt đã báo cáo, loại T; không thay nghiệm thu MySQL nghiệp vụ |

Các tên phương thức trong cột Test là phương thức của T, trừ khi ghi tên lớp khác. Các XML trong `target` có thể bị Maven clean xóa/ghi đè; báo cáo Markdown giữ kết quả lịch sử. Không cộng các bộ chọn khác thời điểm thành tỷ lệ đạt toàn project.

## 2. Bảng điều hành 6A–6H

| Mã | Phạm vi | Hiện trạng | Điều kiện để đóng nhóm |
|---|---|---|---|
| 6A | Auth/User, Book, Genre, Wishlist, quản lý Plan/thống kê | Các lỗi xác nhận trong lượt này đã sửa và test; còn contract/policy chưa được tự ý đổi | Cần chốt A-11 xóa Plan hard/soft và các API/tùy chọn tài liệu chưa expose để đóng toàn bộ phạm vi |
| 6B | Mượn/trả/gia hạn | Các lỗi đã xác nhận được sửa; 33 MySQL + 6 H2 đạt | Không mở rộng thành toàn bộ LLD đã đạt; phần còn thiếu ở B-08/B-09 và 6G/6H |
| 6C | Đặt trước | Đã sửa lỗi xác nhận; policy đã duyệt, 19/19 API + 3/3 H2 đạt | C-08 và MySQL concurrency còn mở; không suy ra toàn bộ LLD đã đạt |
| 6D | Đánh giá sách | Có 6 test API viết sẵn; chưa nghiệm thu riêng | Chốt xóa mềm/cứng và hợp đồng response; chạy/sửa/test lại |
| 6E | Quên/reset mật khẩu | Đã sửa; 8 API MySQL + 80 regression/package đạt | SMTP thật và committed MySQL concurrency còn mở |
| 6F | Subscription, Fine, Payment | Có test offline/H2 và hồi quy; chưa nghiệm thu API MySQL đầy đủ | Kiểm chứng vòng đời, quyền, trạng thái, webhook/đối soát với provider giả lập trước |
| 6G | Ràng buộc, rollback, đồng thời trên MySQL | Có mapping/startup và atomicity H2; còn thiếu MySQL thực | DB test riêng được duyệt, xác minh constraint và transaction commit/rollback/race |
| 6H | HTTP thật, nghiệm thu tổng thể | Chỉ có smoke Bước 5 trước đây | JAR mới, chuỗi API nghiệp vụ thật, đối soát SQL và chạy hồi quy cuối |

## 3. 6A — Auth/User, catalog, wishlist, plan

Code nằm dưới `Library/src/main/java/com/library/`: tên Controller tương ứng thư mục `controller`, ServiceImpl ở `service/impl`, repository ở `repository`. Mỗi dòng là một cụm yêu cầu; chưa phải mọi tổ hợp input đã có test.

| ID | Yêu cầu / nguồn tài liệu | Code / API hiện tại | Test và bằng chứng | Trạng thái / việc còn lại |
|---|---|---|---|---|
| A-01 | Signup, email duy nhất, validation, trả token; D §12, dòng 2169–2220 | AuthController, AuthServiceImpl, UserDTO, UserRepository; `/auth/signup` | `signupNewEmailShouldSucceed`, `duplicateSignupReturnsControlledErrorWithoutChangingUser`, `missingSignupFieldsReturn400`, `blankOrInvalidSignupFieldsReturn400`; A | Đạt giới hạn; đã kiểm tra không tự cấp ADMIN theo request. Còn biên độ dài/đồng thời email → 6G |
| A-02 | Login và phân quyền; D §10/12 | AuthController, JwtProvider/JwtValidator, SecurityConfig | `loginAndAdminAuthorization`, `catalogWritesBlockedForMemberAndAnonymous`, `memberMustNotDeleteCatalogBook`; A | Đạt các route đã chọn; chưa phủ ma trận quyền mọi endpoint, JWT hết hạn và mọi credential sai |
| A-03 | Profile không lộ password, danh sách user; D 1854–1914 | UserController `/api/users/profile`, `/api/users/list`; GET list ADMIN-only theo lựa chọn 05/10/2026 | `profileDoesNotExposePasswordHash`, `memberCannotListAllUsers`, `adminUserListDoesNotExposePasswords` | 3 ca API MySQL 6A đạt; `User.password` chỉ ghi, không serialize. Quyền list đã chốt ADMIN; endpoint profile/list còn giới hạn fields theo hiện trạng |
| A-04 | Tạo/bulk/update/delete sách, FK genre; D §1 | AdminBookController `/api/admin/book/admin`; BookController; BookServiceImpl, BookRepository | `bookCrudAndForeignKey`, `memberCanSearchAndAdminCanBulkCreate`, `invalidBookRejectedBeforeInsert`; A | Đạt luồng cơ bản; D dùng POST `/api/books`, code dùng route admin. Chưa phủ ISBN trùng, rollback bulk có phần tử lỗi, mọi validation/404/409 |
| A-05 | Tìm sách/phân trang/lọc active; D 401–437 | BookController GET `/api/books`, POST `/search`; BookSearchRequest/BookServiceImpl | `advancedSearchDefaultsShouldNotCrash`, `memberCanSearchAndAdminCanBulkCreate` | Search body rỗng/giá trị null dùng page/size/sort mặc định; đạt 6A. Chưa phủ mọi tổ hợp filter/sort/page; GET nhận `activeOnly` nhưng controller chưa chuyển giá trị vào request — giữ là điểm cần chốt/test riêng |
| A-06 | Tồn kho không âm/không vượt tổng; D 165–169, 413–437 | BookDTO, BookServiceImpl; books | `invalidBookRejectedBeforeInsert`, `bookCrudAndForeignKey`; thêm loan tests ở B | Đạt giới hạn; còn update tổng khi đang có loan, catalog cập nhật đồng thời loan, số lượng biên |
| A-07 | Genre CRUD, cây cha/con, count; D §2 | GenreController, GenreServiceImpl, GenreMapper, GenreRepository | `genreCrud`, `bookCountMatchesDatabase`, `bookCountUsesDirectGenreIncludingSoftDeletedTitles`; A; Group2ServiceTests | Count trực tiếp genre đã sửa/đạt. Còn cây nhiều tầng, chu kỳ cha/con, serialize, xóa genre có sách/con, count active và GenreDTO.bookCount |
| A-08 | Thống kê sách đang active/có sẵn; D 171–175 | GET `/api/books/stats`; BookServiceImpl | `bookStatsCountActiveAndAvailableTitles` | 6A kiểm tra thống kê trước/sau xóa mềm trên MySQL; định nghĩa hiện tại là đếm đầu sách có active và availableCopies>0, không cộng bản sao |
| A-09 | Wishlist theo user, không trùng; D §9 | WishlistController `/add/{bookId}`, `/remove/{bookId}`, `/my-wishlist`; WishlistServiceImpl, WishlistRepository | `wishlistCreateReadDelete`; A | Đạt thêm/đọc/xóa cơ bản; còn duplicate, cross-user, notes, missing book, pagination, FK |
| A-10 | Plan CRUD, DTO update, giá/hạn mức; D §8 | SubscriptionPlanController `/admin/create`, `/admin/{id}`, GET base; SubscriptionPlanServiceImpl/Mapper | `planCreateReadDelete`, `planUpdateReturnsUpdatedDto`; A; Group2ServiceTests; MembershipVndTests trong R | DTO update đã sửa/đạt. Chưa phủ planCode trùng/update invalid, inactive filtering, plan đang được subscription tham chiếu |
| A-11 | Xóa mềm plan; D 1546–1554 | `SubscriptionPlanServiceImpl.deleteSubscriptionPlan` gọi repository.delete | `planCreateReadDelete` chỉ kiểm chứng luồng hiện tại, không chứng minh soft delete | Lệch hợp đồng rõ từ source; cần quyết định trước khi đổi business rule. Không thực hiện xóa dữ liệu để kiểm tra trên DB chính |

## 4. 6B — Mượn/trả/gia hạn

| ID | Yêu cầu / nguồn | Code / API | Test và bằng chứng | Trạng thái / việc còn lại |
|---|---|---|---|---|
| B-01 | Mượn bản thân/admin mượn hộ đúng user; D 631–636, 703–735 | BookLoanController, BookLoanServiceImpl, SubscriptionImpl; checkout, checkout/user/{userId} | `loanCheckoutRenewReturnAndQueries`, `adminCheckoutUsesTargetMembership`, `memberCannotCheckoutForAnotherUser`, `loanMembershipTargetIsPrivate`; B | Đạt giới hạn; quota ngày/sách lấy đúng người |
| B-02 | Sách sẵn, hạn mức membership; D 635, 1297–1298 | BookLoanServiceImpl, BookLoanRepository | `checkoutNoMembershipControlledError`, `loanExpiredMembershipReturnsControlledError`, `loanUnavailableBookReturnsControlledError`, `loanInactiveBookReturnsControlledError`, `duplicateCheckoutControlledError`, `checkoutRespectsMembershipDayLimit`, `checkoutRespectsMembershipBookLimit`; B | Các ca đã chạy đạt |
| B-03 | Trả sách, inventory, quyền sở hữu; D 638–642 | `/checkin`; BookLoanServiceImpl | `BookLoanCheckinHistoryTests`, `crossUserCheckinForbidden`, `checkinCannotLeaveLoanCheckedOut`, `loanRepeatedReturnRejectedWithoutInventoryIncrease`, `loanLostReturnDoesNotIncreaseInventory`, `loanAdminCanRenewAndReturnDamaged`, `loanCheckinPreservesOverdueDaysAndAppendsNotes`; B | BE-1: chỉ RETURNED nhập kho; DAMAGED/LOST không nhập kho; lưu lịch sử ngày quá hạn và nối ghi chú. Tiền phạt tự động thuộc phạm vi khác |
| B-04 | Gia hạn, maxRenewals, không overdue; D 644–648, 808–813 | `/renew`; BookLoan.canRenew | `crossUserRenewForbidden`, `loanRenewAtLimitReturnsControlledError`, `loanRenewPastDueBeforeOverdueJobRejected`, `loanTerminalStatesCannotRenew`, `loanExtremeRenewalReturns400BeforeWriting`; B | Đạt các ca đã chạy; quy tắc tổng thời gian gia hạn/membership hết hạn cần chốt nếu mở rộng |
| B-05 | Quá hạn theo ngày và job; D 657–661, 786–790 | `/admin/update-overdue`, BookLoanRepository | `loanCheckoutPastDueBeforeOverdueJobRejected`, `overdueAdminJobStoresDayCount`, `loanOverdueJobRefreshesExistingOverdueCount`, `memberCannotRunOverdueAdminJob`; B | Đạt; chưa kiểm tra batch >1000, không thêm scheduler |
| B-06 | /my, admin search, validation; D 766–780, 798–821 | BookLoanSearchRequest, CheckoutRequest, RenewRequest, CheckinRequest, BookLoanExceptionHandler | `loanMyQueryDoesNotLeakOtherUsers`, `memberCannotSearchAllLoans`, `loanSearchDefaultsAndNegativePagination`, `loanInvalidDaysAndIdsRejectedByValidation`, `loanNullDaysAndLongNotesReturn400`, `loanMissingIdsReturnControlledError`, hai test default days; B | Đạt những ca này; chưa đủ tổ hợp filter. Handler dùng 400 cho lỗi nghiệp vụ, D còn mô tả 404/409: cần chốt hợp đồng status, không gọi là khớp tuyệt đối |
| B-07 | Inventory/quota nguyên tử; yêu cầu toàn vẹn xuyên module | Transaction + row locks ở BookLoanServiceImpl và repositories | BookLoanAtomicityTests: 6 ca rollback/borrow/return/renew cạnh tranh; B | Đạt trên H2 riêng; không suy ra MySQL concurrency đã đạt → G-03 |
| B-08 | Tính phạt khi trả, lưu truy vết; D 642, 741, 813 | BookLoanServiceImpl và FineServiceImpl | Chưa có nghiệm thu chuỗi return-overdue → fine | Chưa phủ/chưa hoàn thiện phần tự tính phạt; không tự đặt đơn giá hoặc thêm nghiệp vụ |
| B-09 | Hợp đồng loan mẫu và endpoints bổ sung; D 705–821 | JSON hiện tại checkoutDays/extensionDays, enum CHECKED_OUT; controller chỉ có 7 route | Test hiện dùng hợp đồng code | Lệch D dueDays/extendDays, ví dụ ACTIVE; D nói chỉ CHECKED_OUT trả được nhưng code cho trả overdue. Chốt khác biệt; endpoints chưa có ở mục 10 |

## 5. 6C — Đặt trước

Code chính: ReservationController, ReservationServiceImpl, ReservationRepository, Reservation và tích hợp BookLoanServiceImpl. Nguồn D §6, dòng 1100–1263; kết quả C.

| ID | Yêu cầu | Test cụ thể | Kết quả / hành động |
|---|---|---|---|
| C-01 | Tạo, /my cách ly user, hủy hợp lệ, required bookId | `reservationCreateListCancel`, `reservationMyListIsIsolated`, `reservationMissingBookIdRejected`, `reservationAdminCanCancel` | 4 ca đạt giới hạn |
| C-02 | Admin đặt hộ đúng target; member không đặt hộ | `adminReservationForUserStoresTargetUser`, `memberCannotReserveForAnotherUser` | 2 fail; HIGH: sai user lưu và thiếu chặn quyền |
| C-03 | Chặn duplicate/sách sẵn; lỗi nghiệp vụ được kiểm soát | `duplicateReservationControlledError`, `reservationAvailableBookRejectedWith4xx` | 2 error; kiểm tra có chặn nhưng exception chưa trả 4xx đúng |
| C-04 | Chặn sách inactive, reservation hết hạn/đã hủy | `reservationInactiveBookRejected`, `reservationExpiredPickupRejected`, `cancelledReservationCannotBeFulfilled` | 3 fail; kiểm tra trạng thái trước mutation |
| C-05 | Chỉ owner/admin thao tác, không đổi status khi từ chối | `crossUserReservationCancelForbidden`, `reservationCrossUserFulfillDoesNotMutateStatus` | 1 error + 1 fail; HIGH. SQL trong transaction test đã đổi status trước lỗi; chưa chứng minh commit trái phép qua HTTP |
| C-06 | Fulfill tạo loan hợp lệ với quota membership | `reservationOwnerFulfillWithinMembershipLimit`, `ownerReservationFulfillCreatesLoan` | Gói 30 ngày đạt; gói 7 ngày error vì checkout mặc định 14. Cần chốt cách chọn ngày, không nới giới hạn loan để che lỗi |
| C-07 | Hủy cập nhật thứ tự hàng đợi; D 1180 | `reservationQueueRemainsOrderedAfterCancel` | Fail: trùng vị trí 2; cần sửa thứ tự và kiểm tra concurrency |
| C-08 | Giới hạn đặt, ưu tiên hàng đợi, fulfill lặp, missing ID, atomicity | Chưa có đủ bằng chứng test | Chưa phủ; xác định policy quota từ code/yêu cầu, không coi mọi giả định test là yêu cầu D |

**Cập nhật BE-2 — 31/10/2026:** các thiếu sót vòng đời sau lần review lịch sử ở trên đã được xử lý. Trả sách `RETURNED` kích hoạt lượt đầu thành `AVAILABLE` trong 72 giờ; scheduler 60 giây/lô 100 tự chuyển `EXPIRED` và kích hoạt lượt kế tiếp; hủy/fulfill xóa vị trí kết thúc và sắp lại hàng; chỉ `AVAILABLE` đứng đầu, còn hạn mới được giao; checkout thường bị chặn nếu sách đang dành cho lượt nhận. `ReservationLifecycleTests`, `ReservationServiceLifecycleTests`, `ReservationExpirySchedulerTests`, `BookLoanReservationGuardTests` và `BookLoanCheckinHistoryTests` là bằng chứng hồi quy mới. Email/chuông không thuộc V1.

## 6. 6D — Review

| ID | Yêu cầu / nguồn | Code | Test / bằng chứng | Trạng thái |
|---|---|---|---|---|
| D-01 | Người đã trả sách mới review, mỗi user/book một review; D 830–866 | BookReviewServiceImpl kiểm tra loan RETURNED và duplicate; repository giữ unique | 6 API review đạt; `reviewRequiresCompletedLoanControlledError`, `duplicateReviewControlledError` | Đạt giới hạn test. Chưa có verified-reader persistence; concurrency chưa kiểm tra |
| D-02 | Owner update/delete, rating 1–5; D 836–839, 890 | BookReviewController/ServiceImpl, CreateReviewRequest/UpdateReviewRequest | `crossUserReviewUpdateForbidden`, `crossUserReviewDeleteForbidden`, `reviewInvalidRating400` | Đạt giới hạn test; title/text biên và nhiều missing ID chưa phủ riêng |
| D-03 | CRUD, xóa mềm và list/filter; D 902–925 | `is_active`; repository lọc active; DELETE đánh inactive; POST 201 | `reviewCreateReadUpdateDelete` xác nhận row còn, inactive, list ẩn và duplicate vẫn chặn | Đạt hành vi hiện expose; bộ lọc/helpful/statistics/my reviews chưa expose, chưa thêm |

## 7. 6E — Reset mật khẩu

| ID | Yêu cầu / nguồn | Code | Test | Trạng thái / thiếu |
|---|---|---|---|---|
| E-01 | Forgot tạo token/link gửi mail; D 2180–2183, 2246 | AuthController/AuthServiceImpl, PasswordResetTokenRepository, EmailService | `forgotPasswordCreatesTokenWithUsableLinkWithoutRealEmail`, `forgotPasswordDoesNotRevealUnknownEmail`, `forgotPasswordRejectsMalformedEmail` | 8 API 6E đạt; email mock, không xác nhận SMTP delivery |
| E-02 | Token hợp lệ đổi password, đăng nhập mới; D 2267–2296 | reset-password; token row lock | `resetPasswordValidTokenAndNewLogin` kiểm tra password mới, password cũ và dùng lại token | Đạt ca đã chạy; committed MySQL concurrency còn mở |
| E-03 | Token sai/hết hạn/password không hợp lệ; D 2187–2188, 2298 | AuthServiceImpl, validation | Ca expired/invalid/blank/missing payload | Đạt ca đã chạy; password strength policy/rate limit/scheduler chưa được xác định hoặc triển khai |

## 8. 6F — Subscription, Fine, Payment

| ID | Yêu cầu / nguồn | Code / API | Test / bằng chứng | Trạng thái / thiếu |
|---|---|---|---|---|
| F-01 | Đọc active đúng user, cancel, admin list/expire; D §7 | SubscriptionController, SubscriptionImpl | `subscriptionReadCancelAndAdminList`, `crossUserSubscriptionCancelForbidden`, `adminCanReadTargetActiveSubscription`, `expiredSubscriptionAdminJob`; BE-3 catalog/API tests | BE-3: danh sách cũ phân trang tại DB, expire dùng POST, GET bị 405; hủy xong được mua mới |
| F-02 | Subscribe khởi tạo payment, VND; D 1329 + yêu cầu thay gateway | SubscriptionImpl, PaymentServiceImpl và payOS services | `disabledSubscribeControlledUnavailableWithoutDraft`; SubscriptionPayOSRoutingTests, PayOSMembershipTests, MembershipVndTests | API MySQL và regression đạt; response payOS tắt được chuẩn hóa 503; chưa bật/call payOS thật |
| F-03 | Tạo/đọc/miễn phạt đúng quyền; D 1035–1085 | FineController/FineServiceImpl, FineRepository | `fineCreateReadWaive`, `memberFineAdminActionsForbidden`, `fineCreateAndWaiveInvalidReferencesReturnClientErrors` | Ca quyền, tạo/đọc/miễn, loan không tồn tại, miễn lặp đạt trên MySQL fixture; lỗi tham chiếu thành 4xx và miễn lặp 409 |
| F-04 | Fine thanh toán qua xác nhận tin cậy; D §5 + payOS đã duyệt | FineServiceImpl, payment settlement | `fineDisabledPaymentAndForgedReceiptBlocked`; FinePaymentTests/FinePayOSRoutingTests/PayOSSettlementTests | Ca chặn transaction giả và payOS tắt đạt; settlement có unit regression; chưa nhận tiền/gọi gateway thật |
| F-05 | Chữ ký, đúng amount/currency/order, chống xác nhận lặp | PayOSController `/webhook/payos`, `/{id}/status`, `/{id}/reconcile`; payOS services | PayOSConfirmationTests, PayOSAtomicityTests, PayOSHttpSecurityTests; `paymentStatusOwnershipAndDisabledGateway` | 12 ca API 6F + regression liên quan đạt; test thật với webhook/gateway HTTPS chưa thực hiện |
| F-06 | Admin lịch sử thanh toán, không lộ dữ liệu user khác; D 2075–2085 | GET `/api/payments`; PaymentController/ServiceImpl | `adminPaymentHistoryIsPagedAndMembersCannotReadIt`, `invalidPaymentHistoryPagingIsControlled` | Đã kiểm tra danh sách có dữ liệu, phân trang, member 403; page/size/sort sai trả 400 |
| F-07 | Callback/verify legacy; D 2031, 2106 được thay | `/verify` trả 410; payOS webhook/reconcile thay xác nhận client | PayOSHttpSecurityTests; `paymentStatusOwnershipAndDisabledGateway` | Đã đạt test; không tin transactionId/redirect client. Thực thu tiền chưa nghiệm thu |

## 9. 6G–6H — Database và nghiệm thu thực

| ID | Yêu cầu | Code / nguồn kiểm tra | Test / bằng chứng | Trạng thái / thiếu |
|---|---|---|---|---|
| G-01 | Table/column/type/FK/enum/nullable/default/index đồng bộ | Entities `modal`, repositories, schema MySQL; D các bảng entity | `CatalogMappingIT` (5), `SubscriptionPaymentMappingIT` (1), `ReviewTokenMappingIT` (1), `PaymentSchemaContractIT` (2); Hibernate `ddl-auto=validate`; metadata read-only đối chiếu 12 bảng và các FK/unique/CHECK quan trọng trên MySQL 9.2 | Đạt các mapping/ràng buộc trong danh mục test. Không khẳng định toàn bộ mọi column/index/cascade/orphanRemoval đã được đối chiếu từng thuộc tính; Hibernate validate không chứng minh hết các mục này |
| G-02 | DB từ chối FK/unique/CHECK sai, bảo vệ dữ liệu tham chiếu | books/genres/users/payments/wishlists/book_reviews; JDBC assertions | 5 test method opt-in: FK insert 1452, FK delete 1451, duplicate email/wishlist/review 1062, payment CHECK 3819 và NOT NULL 1048; toàn bộ pass trên MySQL, fixture trong transaction rollback | Đạt các ca đã kiểm tra. Chưa phủ hết mọi FK/CHECK/enum/decimal/length, cascade/orphanRemoval |
| G-03 | Transaction thực: lỗi giữa chừng không ghi một phần; cạnh tranh không vượt quota/tồn kho/ghi nhận hai lần | `BookLoanServiceImpl`, `ReservationServiceImpl`, `PayOSSettlementService` trên MySQL 9.2 / `library_db1` | `Step6GCommitRaceMySqlIT` — 4/4 pass: checkout rollback khôi phục tồn kho; đua mượn bản cuối chỉ 1 user thành công; reservation đồng thời nhận queue position 1 và 2; hai callback cùng receipt chỉ kích hoạt membership/ghi nhận payment một lần. Test tạo fixture commit với mã duy nhất, cleanup và assert 12 bảng rỗng sau mỗi ca | Đạt cho 4 kịch bản transaction/race nêu trên; không bao phủ mọi kiểu lỗi deadlock/network hoặc mọi race khác. Đã kiểm tra read-only sau suite: 12 bảng đều 0 row; AUTO_INCREMENT có thể tiến sau insert fixture, không reset bộ đếm |
| H-01 | JAR mới startup và HTTP nghiệp vụ thực | JAR mới; datasource `validate`, SQL init/admin initializer/payOS tắt; HTTP local | `mvn -DskipTests clean package` BUILD SUCCESS; JAR khởi động với MySQL 9.2/Tomcat ở port 18001; POST `/auth/login` user vắng mặt trả 403, chỉ phát sinh SELECT. `Step6HLiveApiMySqlIT` chạy luồng HTTP thật qua embedded Tomcat: auth member/admin → đọc plan/subscription → plan mới + subscribe (503 khi PayOS tắt, không có draft/payment mới) → checkout/trả/review → reservation/hủy → tạo/miễn fine → payment status/history và chặn member xem lịch sử | Đạt các luồng backend HTTP nêu trong test; không gọi PayOS thật/không thu tiền; test không phủ mọi API/nhánh lỗi |
| H-02 | Hồi quy và đối soát sau mọi sửa | Regression đã duyệt + SQL read-only sau các test commit | `mvn test`: 72/72 pass; bộ chọn opt-in kết hợp 6G+6H: 19/19 pass; snapshot `library_db1` MySQL 9.2 trước/sau: đúng DB, `read_only=1`, cả 12 bảng đều 0 row | Đạt hồi quy và đối soát trong phạm vi các test đã chạy. Không bao gồm PayOS thật; các giới hạn coverage còn lại ghi tại G-01/G-02/G-03 và bảng module phía trên |

## 10. Danh mục lệch hợp đồng / API tài liệu chưa được expose

Đối chiếu annotation của các controller hiện có, không chỉ comment. “Chưa expose” không có nghĩa service không tồn tại, cũng không tự động cấp phép thêm endpoint.

| Module | Tài liệu nhưng controller chưa expose / khác code | Cách xử lý trong Bước 6 |
|---|---|---|
| Book | GET theo ID/ISBN chưa expose; POST tạo chuyển `/api/admin/book/admin`; mẫu genre string và genreId chưa thống nhất | Chốt hợp đồng đang dùng; không tự đổi URL hoặc thêm API |
| Genre | POST base → `/create`; chưa expose bulk, code, active, active/hierarchy, sub-genres, search, in-use | Tách phần chức năng chưa triển khai khỏi bug route đang có; quyền public trong D không phải mặc định an toàn |
| Loan | Chưa expose GET id, GET user/{userId}, PUT id, statistics; field/default/status và 400/404/409 khác mẫu D | Giữ contract đã dùng cho đến khi được duyệt; đóng 6B theo phạm vi cụ thể, không toàn bộ §3 |
| Reservation | Chưa expose GET id, my/search, GET base danh sách admin, search, queue-position | Sửa luồng đã có trước; không thêm các route này trong đợt fix |
| Review | Chưa expose GET id, my-reviews, user/{id}, statistics, helpful, can-review, admin/statistics; list chưa filter; delete hard khác soft | Ưu tiên chốt xóa mềm và expectation test D-03; features còn lại cần quyết định phạm vi |
| Subscription | Chưa expose history/check/id/renew; admin list dùng `/admin` và `/admin/search` thay `/admin/active` | BE-3 đã sửa danh sách cũ phân trang thật và deactivate-expired thành POST; các route chưa expose vẫn ngoài V1 |
| Plan | Create/update/delete ở `/admin/...`; chưa expose bulk, GET id, permanent riêng | BE-3: DELETE xóa cứng khi plan chưa từng được đăng ký; nếu đã có lịch sử thì chỉ ngừng bán (`active=false`); update có validation |
| Wishlist | Chưa expose update-notes, user/{id}, check, my-count, book/{id}/count | Phần chưa triển khai cần duyệt, không gộp với lỗi luồng add/remove/my |
| User | List thực `/api/users/list`; chưa expose GET user id và statistics; D không nhất quán prefix/quyền list | Chốt quyền và DTO an toàn; không được lộ password dù D nhắc raw entity |
| Fine | Chưa expose các route thống kê, GET chi tiết theo id/book-loan và DELETE id trong D; pay dùng payOS thay tin transactionId | Giữ thay đổi thanh toán được duyệt; nghiệm thu CRUD/phân quyền hiện có |
| Payment | initiate/id/transaction/user/cancel/retry/monthly-revenue trong D chưa expose theo các route đó; verify/webhook legacy được thay payOS | Không coi gateway cũ là chức năng cần khôi phục; retry/cancel/report nếu cần phải duyệt riêng |
| Auth/công nghệ | Bốn route auth hiện có; D liệt kê Google OAuth2 nhưng chưa có bằng chứng nghiệm thu | Không coi schema auth_provider hoặc login local đạt là OAuth đã hoạt động; ngoài phạm vi hiện tại nếu chưa duyệt |

## 11. Trình tự tiếp theo và quy tắc đóng việc

1. Dùng bảng này làm sổ trạng thái chung. Báo cáo cũ giữ lịch sử, không dùng chữ “hoàn tất” của một đợt để thay phạm vi cả hệ thống.
2. Chốt các lệch ảnh hưởng trực tiếp test: review/plan soft-delete, loan status/error contract, ngày fulfill reservation. Không cần quyết định mọi endpoint chưa có để sửa lỗi đã xác nhận.
3. Ưu tiên sửa **6C đã xác nhận** theo duyệt của người dùng, hồi quy 6B; sau đó **6D → 6E → 6F**. Trở lại đóng phần thiếu **6A**, rồi **6G → 6H**. Đây là đề xuất thứ tự, không phải đã bắt đầu sửa.
4. Mỗi nhóm: liệt kê yêu cầu được kiểm tra → test trước sửa → báo lỗi/cause → sửa nhóm nhỏ được duyệt → compile/test → cập nhật từng ID, file thay đổi, kết quả và giới hạn.
5. Các phần chưa triển khai/chưa thống nhất được đánh dấu loại trừ có lý do và chờ quyết định, không âm thầm bỏ để báo 100%.
6. MySQL chính không DROP/TRUNCATE/reset dữ liệu. Test ghi/commit/race cần môi trường dữ liệu thử được duyệt; không tắt guard database rỗng hiện tại. Mọi ALTER nếu thực sự cần phải báo trước riêng.

**Kết luận tại thời điểm lập bảng:** Bước 6 chưa hoàn tất; lỗi 6B đã xác nhận được sửa trong phạm vi đã kiểm chứng, 6C chưa sửa, các nhóm khác còn mức bao phủ khác nhau. Chưa có căn cứ tuyên bố toàn bộ tài liệu–Backend–Database khớp tuyệt đối.
