# FIX-NEW — Lộ trình rà soát và khắc phục Backend + Frontend

Cập nhật: **11/11/2026**  
Trạng thái: **FN-0–FN-6 đã triển khai. FN-4–FN-6 chưa chạy test/build; nghiệm thu tích hợp và kiểm tra trực quan còn ở FN-7.**

## 1. Mục tiêu

Tổng hợp các điểm cần xử lý sau khi review Backend và Frontend, sắp xếp theo phụ thuộc để sửa nghiệp vụ/API trước, rồi mới đồng bộ giao diện và nghiệm thu.

Tài liệu này theo dõi các việc sửa tiếp theo; không thay thế đặc tả hệ thống ở `Library_Management_System_VI.md`, kế hoạch Database ở `dbdatabase.md`, hay hồ sơ trả sách ở `fix-returnbook.md`.

## 2. Hiện trạng liên quan

- Luồng trả sách hai bước RB-1–RB-6 đã được triển khai; theo `fix-returnbook.md`, RB-7 còn chờ xác nhận lần khởi động Backend mới với `ddl-auto=validate` và nghiệm thu MySQL end-to-end trên database thử nghiệm riêng.
- Các hạng mục FIX-NEW dưới đây là follow-up từ review Backend–Frontend, chưa được xem là đã sửa chỉ vì các giai đoạn RB đã hoàn tất.
- Dự án dùng **MySQL** và một file SQL chuẩn duy nhất: `database/library_db1.sql`; không dùng Flyway hoặc Liquibase. Nếu phát sinh thay đổi schema, cập nhật file chuẩn và nêu rõ SQL/tác động trước khi áp dụng lên MySQL live.
- Chính sách trả sách và tiền phạt đã chốt được giữ theo [`fix-returnbook.md`](fix-returnbook.md): quá hạn `min(số ngày trễ × 5.000đ, giá tham chiếu)`; hư hỏng nhẹ 25%, hư hỏng nặng 75%; mất sách 100% giá tham chiếu + 20.000đ phí xử lý.
- Baseline được đọc từ working tree nhánh `backend-fix` ngày 10/11/2026. Nhiều file Backend, Frontend và tài liệu đang có thay đổi chưa commit; không ghi đè hoặc dọn các thay đổi đó trong FN-0.
- Đây là rà soát tĩnh theo code/tài liệu. Không chạy test, không build và không kết nối/ghi MySQL trong FN-0. Kết quả test RB-7 được nhắc ở tài liệu nguồn là kết quả lịch sử, không phải lần chạy mới trên working tree hiện tại.

## 3. Lộ trình đề xuất

| Giai đoạn | Phạm vi | Trạng thái |
|---|---|---|
| **FN-0 — Chốt quy tắc và baseline** | Đối chiếu phát hiện với code hiện tại và chốt ba quy tắc nghiệp vụ. | Hoàn tất 10/11/2026 |
| **FN-1 — Tính toàn vẹn tiền phạt** | Chỉ Backend quyết định số tiền; chỉ check-in phát sinh tiền phạt; xử lý tranh chấp khi hai request cùng tạo một khoản phạt; trả lỗi nghiệp vụ rõ khi vi phạm unique constraint. | Hoàn tất 10/11/2026 |
| **FN-2 — Quy tắc mượn, gia hạn và đặt giữ** | Kiểm tra trạng thái khoản mượn đang hoạt động khi đặt giữ; giới hạn gia hạn mỗi lần theo `min(14, hạn mức gói)`; xác thực ngày ADMIN tiếp nhận. | Hoàn tất 11/11/2026 |
| **FN-3 — Hợp đồng API và thông báo** | Thống nhất định dạng lỗi; rà DTO tiền phạt; dùng Backend làm nguồn duy nhất cho tiền phạt xem trước; chốt thông báo V1 lấy từ API nghiệp vụ thật và không thêm hệ thống thông báo riêng. | Hoàn tất 11/11/2026 |
| **FN-4 — Đồng bộ luồng Frontend USER** | Sửa đường dẫn thông báo tiền phạt; ẩn/chặn thao tác gia hạn khi đang chờ ADMIN nhận sách; bỏ API check-in USER cũ nếu không còn dùng. | Đã triển khai 11/11/2026; chờ nghiệm thu tại FN-7 |
| **FN-5 — Đồng bộ màn hình ADMIN** | Hiển thị yêu cầu trả, ngày nhận và ghi chú kiểm tra; giới hạn ngày nhận hợp lệ; bỏ thao tác tạo phạt thủ công; điều hướng đến đúng danh sách chờ xử lý. | Đã triển khai 11/11/2026; chờ nghiệm thu tại FN-7 |
| **FN-6 — Hoàn thiện giao diện dùng chung** | Đồng bộ màu theo theme ở các thành phần dùng chung; làm thanh tìm kiếm/bộ lọc tự xuống hàng trên màn hình nhỏ. | Đã triển khai 11/11/2026; chờ nghiệm thu tại FN-7 |
| **FN-7 — Nghiệm thu tích hợp** | Chạy kiểm tra tự động phù hợp, xác nhận Backend khởi động với schema chuẩn, rồi thử luồng USER yêu cầu trả → ADMIN tiếp nhận → phát sinh/xem/thanh toán phạt bằng dữ liệu thử cô lập. | Chưa bắt đầu |

## 4. Chi tiết và tiêu chí hoàn thành

### FN-0 — Chốt quy tắc và baseline

- [x] Đối chiếu các phát hiện quan trọng với code Backend, Frontend và schema SQL hiện có.
- [x] Ghi nhận chính sách tiền phạt đã chốt trong `fix-returnbook.md`.
- [x] Ghi nhận kết quả test/build RB-7 như bằng chứng lịch sử và các mục RB-7 còn mở; không xem chúng là xác minh mới.
- [x] Chốt mức gia hạn tối đa mỗi lần.
- [x] Chốt ngày hợp lệ khi ADMIN tiếp nhận sau khi USER gửi yêu cầu trả.
- [x] Chốt endpoint ADMIN tạo khoản phạt thủ công không dùng trong V1.

**Hoàn thành:** người dùng đã chốt ba quy tắc tại Mục 4.3. Các phát hiện đã kiểm tra được ghi ở Mục 4.1.

### 4.1. Baseline phát hiện đã đối chiếu

| ID | Kết quả đọc code hiện tại | Kết luận |
|---|---|---|
| **B1 — Tạo phạt** | Baseline FN-0: `FineServiceImpl.createFine()` từng lấy `type` và `amount` từ request rồi lưu; `POST /api/fines` từng cho ADMIN gọi trực tiếp. Check-in đã tự tính tiền và schema đã có unique index `(book_loan_id, type)`. | **Đã xử lý tại FN-1.** Đường tạo thủ công đã bị gỡ và bị chặn kể cả với ADMIN; chỉ check-in tạo phạt. Xung đột unique được trả `409` bằng thông báo tiếng Việt. |
| **B2 — Đặt giữ khi đang mượn quá hạn** | Baseline FN-0: `ReservationServiceImpl` chỉ tìm khoản `CHECKED_OUT`; lượt `OVERDUE` chưa đóng không được xét trong kiểm tra này. | **Đã xử lý tại FN-2.** Service dùng truy vấn khoản mượn đang hoạt động gồm cả `CHECKED_OUT` và `OVERDUE`; người đang giữ khoản mượn chưa đóng không thể đặt cùng cuốn. |
| **B3 — Ngày nhận thực tế** | Baseline FN-0: Backend chỉ từ chối ngày trước `checkoutDate` hoặc sau hôm nay; khi đã có yêu cầu trả chưa so với ngày `returnRequestedAt`. | **Đã xử lý tại FN-2/FN-5.** Backend và trường ngày trên màn hình ADMIN cùng áp dụng mốc yêu cầu trả; nhận trực tiếp thì không trước ngày mượn; cả hai không được ở tương lai. |
| **B4 — Gia hạn** | Baseline FN-0: service cộng toàn bộ số ngày client gửi, chỉ kiểm tra số lần gia hạn và yêu cầu trả đang chờ. | **Đã xử lý tại FN-2.** Mỗi lần gia hạn bị giới hạn bởi `min(14, maxDaysPerBook của gói đang hiệu lực)`; các điều kiện số lần và yêu cầu trả chờ vẫn được giữ. |
| **B5 — JSON lỗi** | Baseline FN-0: một số controller trả `{error: ...}` hoặc `{Lỗi: ...}`, còn API client có thể rơi về chuỗi `HTTP <status>`. | **Đã xử lý tại FN-3.** Các lỗi controller liên quan dùng `ApiResponse {message, status}`; client đọc tương thích `message`, `error`, `Lỗi`, `detail` và có câu tiếng Việt theo mã HTTP. |
| **B6 — Thông báo** | UI USER tạo thông báo từ danh sách fine và ADMIN tạo từ API hàng chờ trả; cả hai poll theo chu kỳ, trạng thái đã đọc lưu trong `localStorage`. Đây không phải API/thông báo được lưu ở Backend. Baseline FN-0 có route USER `/user/fines` sai; thông báo ADMIN mở `/admin/loans` ở trạng thái mặc định thay vì tab chờ trả. | **Đã chốt phạm vi tại FN-3.** V1 không thêm bảng/API thông báo tổng quát và không hiển thị dữ liệu giả; chỉ tổng hợp cảnh báo từ API nghiệp vụ thật, còn trạng thái đã đọc lưu cục bộ. Route USER đã sửa tại FN-4; ADMIN điều hướng đến `/admin/loans?tab=returnRequests` tại FN-5. |
| **B7 — Chi tiết ADMIN** | API DTO/mapper có `returnRequestedAt`, `returnRequestNote`, `checkedInAt`, `inspectionNote`. Baseline chưa hiển thị kết quả nhận sách trong hộp thoại chi tiết. | **Đã xử lý tại FN-5.** Chi tiết ADMIN hiển thị thời điểm/ghi chú yêu cầu trả, ngày ADMIN nhận và ghi chú kiểm tra. |
| **B8 — DTO và giao diện** | Baseline FN-0: `BookLoanDTO` còn `fineAmount`, `finePaid` nhưng mapper không gán; Frontend chỉ có hai trường này trong fixture. `AppThemeProvider` có tạo theme tối, nhưng `SearchFilterBar` vẫn đặt nền/viền/màu cố định sáng. | **Phần DTO đã xử lý tại FN-3:** bỏ hai trường không có nguồn dữ liệu và fixture tương ứng. Phần theme/responsive vẫn thuộc FN-6. |

### 4.2. Trạng thái kiểm chứng

- Schema nguồn có metadata RB-1 và unique index fine; theo `fix-returnbook.md`, live MySQL đã được backup, cập nhật và kiểm tra ngày 10/11/2026.
- `fix-returnbook.md` ghi RB-7 có 199 test Backend, 104 test Frontend và production build đạt; vẫn còn xác nhận startup mới với `ddl-auto=validate` và MySQL E2E trên DB `_test` riêng.
- FN-0 không chạy lại các lệnh trên. Do working tree đang có nhiều thay đổi chưa commit, phải xác minh lại trước khi kết luận test cũ vẫn áp dụng cho trạng thái hiện tại.

### 4.3. Quyết định đã chốt trước FN-1

| Quy tắc | Quyết định đã chốt | Áp dụng từ |
|---|---|---|
| Gia hạn mỗi lần | Số ngày cộng thêm không vượt quá `min(14, maxDaysPerBook của gói đang hiệu lực)`. | FN-2 |
| Ngày ADMIN nhận sách | Nếu có yêu cầu trả, `receivedDate` không sớm hơn ngày gửi yêu cầu; nếu ADMIN nhận trực tiếp không có yêu cầu thì không sớm hơn ngày mượn. Ngày nhận không được ở tương lai. | FN-2 và FN-5 |
| Tạo tiền phạt | Không tạo khoản phạt thủ công trong V1. Các khoản `OVERDUE`, `DAMAGE`, `LOSS` chỉ được Backend tính và tạo khi ADMIN check-in. Phí xử lý mất sách nằm trong fine `LOSS`; không tạo `PROCESSING` riêng. | FN-1; bỏ nút/hành động ADMIN ở FN-5 nếu đang có |

Trạng thái: **Đã chốt ngày 10/11/2026. Quy tắc tạo tiền phạt đã triển khai tại FN-1; quy tắc Backend về gia hạn và ngày nhận đã triển khai tại FN-2; màn hình ADMIN được đồng bộ tại FN-5.**

### FN-1 — Tính toàn vẹn tiền phạt

- [x] Không tin số tiền do client gửi cho các khoản phạt được tính theo nghiệp vụ: DTO/request và method service tạo phạt thủ công đã bị loại bỏ.
- [x] Khóa/bỏ API ADMIN tạo tiền phạt thủ công; `POST /api/fines` bị `denyAll` kể cả với ADMIN; chỉ check-in tạo `OVERDUE`, `DAMAGE` hoặc `LOSS` theo quy tắc đã chốt.
- [x] Bảo đảm cùng một lượt mượn không tạo trùng một khoản cùng loại: check-in khóa bi quan lượt mượn, kiểm tra tồn tại và schema giữ unique constraint `uq_fines_book_loan_type` làm chốt cuối.
- [x] Bắt lỗi unique constraint ở API và trả `409` với thông báo tiếng Việt; không trả chi tiết SQL/Hibernate cho client.
- [x] Xác minh việc check-in và tạo phạt cùng transaction: test lỗi ghi phạt xác nhận trạng thái lượt mượn, tồn kho và các fine đều rollback.

**Kết quả:** hoàn tất ngày 10/11/2026. Test trọng tâm đạt `24/24`; toàn bộ Backend đạt `202/202` test bằng `.\mvnw.cmd test`. Không cần ALTER Database vì unique constraint chuẩn đã tồn tại trong entity và `database/library_db1.sql`. Tại thời điểm FN-1, nút/form Frontend còn được giữ lại; chúng đã được loại bỏ trong FN-5.

### FN-2 — Quy tắc mượn, gia hạn và đặt giữ

- [x] Đặt giữ xét mọi trạng thái khoản mượn còn hiệu lực: truy vấn `hasActiveCheckout` chặn cả `CHECKED_OUT` và `OVERDUE` chưa được ADMIN đóng.
- [x] Gia hạn tiếp tục kiểm tra số lần và chặn yêu cầu trả đang chờ; số ngày cộng thêm mỗi lần không vượt quá `min(14, maxDaysPerBook của gói đang hiệu lực)`.
- [x] Backend kiểm tra ngày nhận thực tế: không trước ngày yêu cầu trả; nếu nhận trực tiếp thì không trước ngày mượn; không cho ngày tương lai.
- [x] Đã đối chiếu schema và truy vấn: các cột/truy vấn cần thiết đã có, không cần thêm CHECK, index hoặc ALTER Database.

**Kết quả:** hoàn tất ngày 11/11/2026. Test tập trung đạt `23/23`; toàn bộ Backend đạt `208/208` test bằng `.\mvnw.cmd test`. Không thay đổi schema MySQL và không sửa Frontend trong giai đoạn này.

### FN-3 — Chuẩn hóa hợp đồng API

- [x] Chuẩn hóa JSON lỗi của các controller liên quan về `ApiResponse {message, status}`; API client đọc tương thích các khóa cũ và luôn có thông báo tiếng Việt thay vì chỉ hiện mã HTTP.
- [x] Bỏ `fineAmount`, `finePaid` khỏi DTO lượt mượn và fixture Frontend vì mapper/schema không cung cấp hai giá trị tổng hợp này.
- [x] Thêm endpoint ADMIN `POST /api/book-loans/admin/checkin-preview`; màn hình ADMIN lấy số tiền xem trước trực tiếp từ Backend và không còn tự nhân tỷ lệ/phí ở Frontend.
- [x] Chốt thông báo V1: không thêm bảng/API thông báo tổng quát, không tạo dữ liệu giả; USER/ADMIN chỉ nhận cảnh báo tổng hợp từ API nghiệp vụ thật, trạng thái đã đọc lưu cục bộ. Route và đích điều hướng được sửa ở FN-4/FN-5.

**Hoàn thành khi:** các trang dùng một cách đọc lỗi thống nhất; DTO không trả trường rỗng/không rõ nghĩa; số tiền xem trước không mâu thuẫn với số tiền được ghi nhận.

**Kết quả:** hoàn tất ngày 11/11/2026. Backend dùng chung một phép tính cho xem trước và check-in thật; preview là thao tác chỉ đọc và vẫn yêu cầu ADMIN. Test tập trung Backend đạt `10/10`; toàn bộ Backend đạt `247/247`. Toàn bộ Frontend đạt `106/106`, production build đạt và lint các file Frontend sửa trong FN-3 đạt. Không cần ALTER Database.

### FN-4 — Đồng bộ Frontend USER

- [x] Thông báo và nút xem khoản phạt trên Navbar trỏ đến route hiện có `/user/my-fines`.
- [x] Không hiển thị thao tác gia hạn khi lượt mượn đang chờ ADMIN tiếp nhận trả; điều kiện kiểm tra `returnPending` và `returnRequestedAt` chưa được check-in.
- [x] Bỏ hàm API check-in USER cũ sau khi xác nhận không có màn hình/caller nào sử dụng; contract test chuyển sang endpoint yêu cầu trả sách.

**Hoàn thành khi:** luồng USER dùng đúng endpoint, route và trạng thái; lỗi từ Backend được hiển thị bằng thông báo dễ hiểu.

**Kết quả triển khai:** hoàn tất ngày 11/11/2026. Đây là ghi nhận thay đổi mã nguồn và contract test; chưa chạy test hoặc build trong FN-4. Việc xác minh tự động được thực hiện ở FN-7.

### FN-5 — Đồng bộ màn hình ADMIN

- [x] Màn hình chi tiết thể hiện ghi chú yêu cầu trả, thời điểm yêu cầu, ngày ADMIN nhận sách và ghi chú kiểm tra.
- [x] Danh sách có chỉ báo `Chờ tiếp nhận`; tab hàng chờ trả hiển thị số lượt đang chờ.
- [x] Bỏ nút/form và API client tạo phạt thủ công; ADMIN chỉ kiểm tra, xác nhận và để Backend tính phạt khi check-in. Chức năng miễn phần còn nợ vẫn giữ.
- [x] Ngày nhận thực tế có giới hạn tối thiểu theo ngày yêu cầu trả (hoặc ngày mượn nếu nhận trực tiếp), tối đa hôm nay; Frontend kiểm tra trước khi gửi, Backend vẫn là nguồn xác thực cuối.
- [x] Thông báo ADMIN lấy từ API hàng chờ trả thật và mở thẳng `/admin/loans?tab=returnRequests`; không thêm thông báo giả hoặc API thông báo mới.
- [x] Ẩn thao tác gia hạn khi lượt mượn đã có yêu cầu trả đang chờ ADMIN tiếp nhận.

**Kết quả triển khai:** hoàn tất ngày 11/11/2026. Hộp thoại chi tiết ADMIN đã hiển thị đầy đủ dữ liệu yêu cầu và kết quả check-in; danh sách cho biết lượt đang chờ; ngày nhận được ràng buộc ở UI; thao tác tạo phạt thủ công được gỡ khỏi giao diện và API client. Không thay đổi Backend hoặc Database trong FN-5. Chưa chạy test/build; nghiệm thu tự động vẫn dành cho FN-7.

### FN-6 — Giao diện dùng chung

- [x] Xác nhận `AppThemeProvider` đã đọc tùy chọn đã lưu và dựng MUI theme; nguyên nhân lệch chủ yếu là các thành phần dùng chung đặt màu cứng, cùng nút Navbar suy ra chế độ tối từ tùy chọn thay vì chế độ đã được phân giải.
- [x] Chuyển `SearchFilterBar`, `StatusChip`, `EmptyState`, `ConfirmDialog`, `StatCard`, `PageHeader` và các bề mặt thông báo/Navbar sang token màu của theme ở những chỗ cần đổi sáng/tối.
- [x] Làm thanh tìm kiếm, nhóm bộ lọc và nhóm thao tác có thể co giãn/xuống hàng; trên màn hình hẹp các trường bộ lọc xếp thành cột, không ép cùng một hàng.
- [x] Nút sáng/tối dùng chế độ MUI đang áp dụng, kể cả khi tùy chọn là “Theo thiết bị”; thanh cuộn cũng đổi màu trong chế độ tối.
- [x] Giữ nguyên màu chủ đạo `#1769ff` và bộ icon đã chốt.

**Kết quả triển khai:** hoàn tất ngày 11/11/2026. Theme provider và thứ tự provider không cần thay đổi; các thành phần dùng chung được chuyển sang palette token, còn thanh tìm kiếm/bộ lọc được phép wrap theo chiều rộng. Chưa chạy test, build hoặc kiểm tra trực quan trên trình duyệt; việc đó thuộc FN-7. Do chưa có browser QA ở giai đoạn này, chưa xác nhận thực tế mọi kích thước màn hình.

**Hoàn thành khi:** tùy chọn giao diện áp dụng nhất quán và bố cục không chồng lấn ở kích thước màn hình được hỗ trợ. Phần sửa mã đã hoàn tất; tiêu chí hiển thị thực tế sẽ được nghiệm thu tại FN-7.

### FN-7 — Nghiệm thu tích hợp

- [ ] Chạy test Backend liên quan đến fine, gia hạn, đặt giữ và check-in.
- [ ] Chạy test/build Frontend liên quan đến API lỗi, thông báo, USER và ADMIN.
- [ ] Xác nhận Backend khởi động với `spring.jpa.hibernate.ddl-auto=validate` trên schema đã đồng bộ.
- [ ] Chạy MySQL end-to-end trên database thử nghiệm cô lập, không dùng dữ liệu thật trong `library_db1` làm fixture.
- [ ] Cập nhật kết quả thực tế, lệnh chạy và lỗi còn lại trong tài liệu này.

**Hoàn thành khi:** các kiểm tra trên đạt; dữ liệu lượt mượn, tồn kho và tiền phạt nhất quán sau toàn luồng.

## 5. Thứ tự phụ thuộc

`FN-0 → FN-1 và FN-2 → FN-3 → FN-4 và FN-5 → FN-6 → FN-7`

FN-4/FN-5 có thể thực hiện song song sau khi hợp đồng API và quy tắc FN-1–FN-3 đã ổn định. Không cần chỉnh UI trước khi các route/trạng thái/API tương ứng được xác nhận.

## 6. Nhật ký tiến độ

| Ngày | Giai đoạn | Cập nhật |
|---|---|---|
| 10/11/2026 | Tạo tài liệu | Tổng hợp lộ trình follow-up từ review Backend–Frontend; chưa sửa code. RB-7 vẫn có các mục nghiệm thu runtime/MySQL ghi tại `fix-returnbook.md`. |
| 10/11/2026 | FN-0 | Đối chiếu code/API/SQL hiện tại; xác nhận các phát hiện B1–B8 và chốt giới hạn gia hạn, ngày nhận sách, chỉ tạo phạt qua check-in. Không chạy test/build và không sửa code/schema. |
| 10/11/2026 | FN-1 | Gỡ API/controller/service/request tạo phạt thủ công; chặn `POST /api/fines` kể cả ADMIN; giữ phạt chỉ phát sinh trong transaction check-in; thêm phản hồi `409` tiếng Việt cho vi phạm unique; bổ sung test đồng thời/rollback và đồng bộ test MySQL cũ sang luồng check-in. Test trọng tâm `24/24`, toàn bộ Backend `202/202` đạt. Không đổi schema. |
| 11/11/2026 | FN-2 | Đặt giữ dùng truy vấn khoản mượn đang hoạt động gồm `CHECKED_OUT` và `OVERDUE`; gia hạn giới hạn theo `min(14, hạn mức gói)`; ngày ADMIN nhận sách tuân thủ mốc yêu cầu trả hoặc ngày mượn khi nhận trực tiếp. Test tập trung `23/23`, toàn bộ Backend `208/208` đạt. Không đổi schema/Frontend. |
| 11/11/2026 | FN-3 | Chuẩn hóa lỗi API và cách đọc lỗi tiếng Việt; bỏ trường fine không được map; thêm preview tiền phạt check-in do Backend tính; chốt thông báo V1 lấy từ API nghiệp vụ thật, không thêm bảng/API riêng. Backend `247/247`, Frontend `106/106`, build và lint phạm vi sửa đạt; không đổi schema. |
| 11/11/2026 | FN-4 | Navbar USER điều hướng cảnh báo phạt đến `/user/my-fines`; gia hạn bị chặn khi DTO báo yêu cầu trả đang chờ; gỡ API check-in USER không còn caller và cập nhật contract test sang return-request. Chưa chạy test/build; nghiệm thu dành cho FN-7. |
| 11/11/2026 | FN-5 | Chi tiết lượt mượn ADMIN hiển thị thời điểm/ghi chú yêu cầu trả, ngày tiếp nhận và ghi chú kiểm tra; danh sách đánh dấu lượt chờ tiếp nhận; thông báo mở trực tiếp tab hàng chờ; chặn gia hạn khi yêu cầu trả đang chờ; gỡ nút/form và API client tạo phạt thủ công; giới hạn ngày nhận theo quy tắc FN-2. Chưa chạy test/build; nghiệm thu dành cho FN-7. |
| 11/11/2026 | FN-6 | Các thành phần dùng chung chuyển sang token theme; Navbar dùng chế độ đã phân giải; `SearchFilterBar` tự wrap trường tìm kiếm, bộ lọc và thao tác; thanh cuộn tối đổi màu. Không đổi màu thương hiệu/icon. Chỉ rà diff và whitespace; không chạy test/build hoặc browser QA. FN-7 vẫn chưa bắt đầu. |

