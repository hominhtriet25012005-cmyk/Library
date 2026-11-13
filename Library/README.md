# Library Management System

Backend Spring Boot + MySQL `library_db1`; frontend React/Vite tại [`../frontend/library-frontend`](../frontend/library-frontend). Giao diện tiếng Việt, màu chính `#1769ff`.

## Đang ở đâu?

| Chặng | Trạng thái ngày 08/10/2026 |
|---|---|
| Backend + MySQL | Đã thực hiện B0 và Bước 1–7 theo phạm vi từng đợt; **chưa nghiệm thu toàn bộ**. Xem bảng Backend ngay dưới và [báo cáo Bước 7](../docs/STEP7_FINAL_REVIEW.md). |
| USER (F0–F4C) | Đã dựng và nối frontend theo module. Lần kiểm tra F4C: 37/37 test, lint và build đạt. Chưa nghiệm thu toàn bộ luồng USER bằng tài khoản thật trên MySQL chính. |
| Thanh toán payOS/VietQR | UI QR/link và tra trạng thái backend đã có; tạo đơn vẫn tắt mặc định. Xem [tài liệu tích hợp và vận hành payOS](../docs/PAYOS.md). |
| ADMIN (F5) | **AD0–AD5, AD7–AD8 đã triển khai mã; AD6 còn chờ chốt thao tác thay đổi gói. AD9 đã kiểm thử tự động và lập [báo cáo nghiệm thu](../docs/AD9_ADMIN_ACCEPTANCE.md), nhưng chưa đóng end-to-end.** MySQL hiện không kết nối được; còn chờ nghiệm thu API/database và giao diện bằng phiên ADMIN thật. |
| PUBLIC (F6) và nghiệm thu (F7) | Chưa triển khai đầy đủ. |
| Ổn định frontend (FE-R1–FE-R5) | **FE-R1 và FE-R2 đã triển khai ngày 09/10/2026.** FE-R2 sửa hiển thị lỗi ngay trong hộp xác nhận, nhãn/kích thước phân trang, trạng thái tải/lỗi khi tìm sách, trạng thái thanh toán tiếng Việt và props MUI cũ. Build và 67/67 test đạt; lint toàn frontend còn 33 lỗi. FE-R3–FE-R5 và nghiệm thu trình duyệt/API thật chưa thực hiện. |

Chi tiết từng đợt USER, backend, backup và kết quả kiểm thử cũ được giữ nguyên trong [README_HISTORY.md](README_HISTORY.md); README này chỉ là bảng điều hướng và tiến độ hiện hành.

### Lộ trình ổn định frontend trước khi chỉnh giao diện

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| FE-R1 | Lỗi chức năng quan trọng: hồ sơ/bảo mật, trạng thái thể loại, bộ lọc dùng chung | Đã triển khai; chờ kiểm thử thủ công trên phiên thật |
| FE-R2 | Thông báo lỗi thao tác, phân trang, props MUI và trạng thái tải | Đã triển khai; build/67 test đạt, còn kiểm thử thủ công và lint toàn dự án |
| FE-R3 | Kiểm thử và sửa từng luồng USER | Chưa bắt đầu |
| FE-R4 | Kiểm thử và sửa từng luồng ADMIN | Chưa bắt đầu |
| FE-R5 | Nghiệm thu build/test/lint, điều hướng và responsive | Chưa bắt đầu |
| UI-R | Chốt mẫu USER/ADMIN, áp dụng giao diện và nghiệm thu đa kích thước | Sau FE-R5 |

## Backend + MySQL — tiến độ cần theo dõi

Các con số sau là **bằng chứng tại thời điểm đã ghi**, không phải kết quả vừa chạy lại trong lượt cập nhật README này.

| Mốc | Đã làm / đã kiểm chứng | Chưa thể kết luận |
|---|---|---|
| Bước 1–3 — Review/sửa Backend | Đã review source và MySQL, rồi sửa compile/DI, mapping/cấu hình và các luồng theo nhóm; chi tiết thay đổi nằm trong [nhật ký](README_HISTORY.md). | Các lượt compile/build theo nhóm không chứng minh mọi nghiệp vụ đúng. |
| B0 — Đồng bộ schema | Ba nhóm `subscription_plans`, review/reset-token và payment CHECK/default đã áp dụng; startup Hibernate `validate` thành công. | `validate` chưa chứng minh mọi CHECK, index, enum hoặc thao tác ghi đều đúng. Không tạo lại database. |
| Bước 4–5 — Build/runtime | Đã tạo JAR, 68 test ở lượt Bước 4; JAR kết nối MySQL và 9 HTTP smoke checks đạt ở Bước 5. | Startup và smoke không thay thế kiểm thử mọi API ghi dữ liệu. |
| Bước 6 — API + Database | 6A–6F đã sửa/kiểm thử theo từng nhóm; 6G–6H có các lượt MySQL và live HTTP chọn lọc. Bước 7 chạy **104 test API MySQL rollback** đạt; sau lượt đó 12 bảng kiểm tra đều 0 dòng. BE-5 đã thêm profile `mysql-contract` và `mysql-e2e`. | Không phải toàn bộ giao dịch thật hay mọi nhánh đồng thời. `mvn test` chỉ chạy unit/H2; `*IT` chỉ chạy qua profile và database `_test`. |
| Bước 7 — Final Review | Đã đối chiếu code–test–tài liệu và lập [danh sách FR-01–FR-07](../docs/STEP7_FINAL_REVIEW.md). F4A bổ sung chặn mua chồng gói; AD2 bổ sung khóa hàng khi sửa tồn kho và chặn chu trình thể loại. | FR-01/FR-05 đã có biện pháp trong mã nhưng chưa thử ghi/đồng thời trên MySQL chính. Còn secret cấu hình (FR-03), batch quá hạn (FR-04), quy trình integration test (FR-06); luồng gói F4A chưa thử thanh toán/MySQL committed thật. |

**Ưu tiên trước vận hành thật:** BE-0 đã đưa secret/JWT ra khỏi source, nhưng các credential từng lộ vẫn phải được đổi/thu hồi; nghiệm thu ghi/đồng thời tồn kho AD2 trên môi trường thử nghiệm trước khi dựa vào đó vận hành; kiểm tra chính sách một gói active và webhook HTTPS trước khi bật payOS. [Nhật ký backend đầy đủ](README_HISTORY.md) giữ lệnh, kết quả và giới hạn từng lượt.

### BE-0 — cấu hình an toàn và JWT (31/10/2026)

Đã chuyển MySQL, Gmail và JWT secret sang biến môi trường; `JWT_SECRET` bắt buộc tối thiểu 32 byte. Backend không còn tin vai trò ghi trong token mà tải lại USER/vai trò hiện tại từ MySQL ở mỗi request. Nhóm JWT/startup và phân quyền HTTP đạt 23/23 test. Trước khi chạy lại trong IntelliJ, cấu hình `DB_PASSWORD`, `JWT_SECRET` và các biến mail/admin cần dùng trong **Edit Configurations → Environment variables**. Xem [hướng dẫn BE-0](../docs/BE0_SECURITY_CONFIGURATION.md).

## Sitemap ADMIN đã chốt

| Nhóm Sidebar | Mục | Route frontend |
|---|---|---|
| Tổng quan | Dashboard | `/admin/dashboard` |
| Quản lý thư viện | Sách · Thể loại · Người dùng | `/admin/books` · `/admin/genres` · `/admin/users` |
| Nghiệp vụ thư viện | Mượn–trả · Đặt giữ · Đánh giá | `/admin/loans` · `/admin/reservations` · `/admin/reviews` |
| Thành viên & tài chính | Gói thành viên · Tiền phạt · Thanh toán | `/admin/subscriptions` · `/admin/fines` · `/admin/payments` |

Tổng cộng **10 mục Sidebar**. `Gói thành viên` có hai tab `/admin/subscriptions/plans` (Các gói) và `/admin/subscriptions/members` (Thành viên đăng ký); `/admin/subscriptions` mở tab Các gói. `/admin` chuyển tới Dashboard. Topbar chứa Thông báo, Cài đặt cá nhân/giao diện và menu tài khoản (chuyển ADMIN ↔ USER, đăng xuất). Chuyển giao diện **không đổi JWT hoặc giả danh người dùng khác**. Chuông chưa có dữ liệu thật thì không hiển thị số giả.

**Quy tắc vai trò V1 đã chốt:** chỉ có `ADMIN` và `USER`, không tạo `ROLE_LIBRARIAN`. ADMIN thực hiện nghiệp vụ quản trị; USER chỉ thao tác trong phạm vi được phép trên tài khoản của mình. ADMIN có thể xem giao diện USER bằng chính tài khoản ADMIN, không đổi vai trò hay danh tính.

## Lộ trình F5 — ADMIN × API

Các endpoint dưới đây được đối chiếu từ **source backend hiện tại**, không lấy bảng API trong bản thiết kế ADMIN làm bằng chứng. “Có API” chưa có nghĩa là đã kiểm thử end-to-end. Mỗi AD là **một đợt độc lập**: review hợp đồng → sửa nhóm nhỏ → test/build → báo file/API/kết quả/tồn đọng; chỉ chuyển đợt khi bạn yêu cầu.

**AD0 (08/10/2026):** Đã dựng Sidebar/Topbar responsive, 10 route quản trị và hai tab gói ở trạng thái chờ AD6; `/admin` chuyển tới Dashboard. USER không vào ADMIN, ADMIN có thể qua khu USER bằng cùng phiên và quay lại. Chuông/số liệu thật chưa có nên không tạo dữ liệu giả; cài đặt giao diện để AD8. Frontend **39/39 test, lint, build đạt**; trình duyệt chưa đăng nhập được bằng tài khoản ADMIN để nghiệm thu menu/mobile trực tiếp. Không sửa Backend/MySQL.

**AD1 (08/10/2026):** Dashboard đọc `GET /api/books/stats` để hiện hai tổng đầu sách, và dùng `totalElements` từ hai truy vấn `POST /api/book-loans/search` (`size=1`) cho tổng lượt mượn và lượt quá hạn theo ngày. Có loading, dữ liệu 0, lỗi/Thử lại và liên kết nhanh; không dùng số mẫu, không tính doanh thu. **43/43 test, lint, build đạt** với API giả lập trong test. Chưa nghiệm thu màn hình bằng ADMIN/MySQL thật; không sửa Backend/schema/dữ liệu.

**AD2 (08/10/2026):** `/admin/books` có danh sách/lọc/chi tiết/thêm/sửa và `/admin/genres` có cây thể loại, thêm/sửa/ẩn/hiện. Sách chỉ xóa cứng được khi chưa có bản ghi liên kết; FK từ mượn, đặt giữ, đánh giá và wishlist sẽ chặn xóa, giữ nguyên sách và lịch sử. Backend đọc cả sách ẩn; khóa hàng khi cập nhật tồn kho như mượn/trả; đổi tổng bản giữ nguyên số bản đang không sẵn và từ chối tổng mới thấp hơn số đó. Việc đổi cha thể loại chặn tự tham chiếu/chu trình; chuyển về cấp gốc được. **Maven test mặc định, 45/45 test frontend, lint, build đạt**; kiểm thử đọc MySQL với Hibernate `validate` đạt, không ghi DB. Chưa nghiệm thu thao tác ghi/đồng thời trên MySQL chính hoặc giao diện bằng tài khoản ADMIN thật; không đổi schema.

**ADMIN Sách — S0/S1/S2/S3:** S0 đã rà source/schema SQL; chưa nghiệm thu trực tiếp trên MySQL chính. S1 chốt tồn kho và xóa: sách mới sẵn toàn bộ bản; sửa tổng giữ nguyên số bản đang không sẵn; FK chặn xóa cứng khi có lịch sử mượn, đặt giữ, đánh giá hoặc wishlist, API trả HTTP 409. S2 hoàn thiện form thêm/sửa, kiểm tra hợp đồng dữ liệu, khóa ISBN khi sửa và giữ quy tắc tồn kho. S3 Backend nhận `multipart/form-data` tại `POST /api/admin/books/covers` (chỉ ADMIN), lưu JPEG/PNG tối đa 5 MB bằng tên UUID trên filesystem; ảnh được đọc công khai qua `GET /api/book-covers/{filename}`. Mặc định lưu ở `uploads/book-covers`; cấu hình bằng `BOOK_COVERS_DIR`, URL public bằng `APP_PUBLIC_BASE_URL` (mặc định `http://localhost:8000`). Không thêm cột/schema hay ghi MySQL. **32/32 test Backend catalog/mượn-trả/phân quyền/upload; 74/74 test frontend của S2; build S2 đạt.** S4 tích hợp upload vào form Frontend và S5 nghiệm thu xuyên suốt còn chờ. Ảnh đã tải lên nhưng chưa gắn vào sách chưa có job dọn tự động.

**AD3 (08/10/2026):** `/admin/users` đọc `GET /api/users/list` và chỉ hiển thị ID, tên, email, điện thoại, vai trò, lần đăng nhập gần nhất; có tìm kiếm, lọc vai trò, phân trang cục bộ và xem chi tiết. Không có thêm/sửa/xóa, đổi vai trò hoặc khóa tài khoản. **49/49 test frontend, lint, build và Maven test mặc định đạt**; test bảo mật xác nhận USER không đọc được danh sách, ADMIN đọc được và không lộ password hash. Chưa kiểm tra trực tiếp trên trình duyệt bằng tài khoản ADMIN; API hiện tải toàn bộ người dùng rồi frontend mới phân trang, chưa phù hợp dữ liệu rất lớn. Không sửa backend nghiệp vụ, schema hay dữ liệu MySQL.

**AD4 (08/10/2026):** `/admin/loans` tra cứu một bộ lọc mỗi lần (tất cả/quá hạn/trạng thái/ID người dùng/ID sách) với phân trang server, xem chi tiết, cấp sách, trả (bình thường/mất/hư hỏng), gia hạn và xác nhận cập nhật quá hạn. Giao diện không có Sửa/Xóa lượt mượn, không tự tạo tiền phạt. Backend sửa batch quá hạn bằng phân trang theo ID để xử lý quá 1.000 bản ghi, kiểm tra lại sau khóa và chỉ ghi bản ghi thay đổi; phản hồi số lượt đã cập nhật. **53/53 test frontend, lint, build đạt; test AD4 HTTP/quyền, query H2 và bộ Maven không cần MySQL đạt.** `mvn test` đầy đủ còn lỗi duy nhất ở `LibraryApplicationTests.contextLoads` vì MySQL `localhost:3306` hiện không kết nối được. Chưa thử thao tác ghi trên MySQL chính hoặc nghiệm thu UI bằng phiên ADMIN thật; không đổi schema/dữ liệu MySQL.

**BE-1 (31/10/2026, mốc lịch sử):** Đã giữ lịch sử `overdueDays`, nối ghi chú trả sách, chỉ `RETURNED` nhập kho; `DAMAGED`/`LOST` không tăng bản sẵn. Luồng hiện hành được mở rộng ở RB-1–RB-6: USER gửi yêu cầu, ADMIN kiểm tra và check-in; Backend tự tạo phạt trong transaction và chỉ trả bình thường mới kích hoạt hàng chờ. Xem [theo dõi RB](../docs/fix-returnbook.md).

**BE-2 (31/10/2026):** Vòng đời đặt giữ đã tự vận hành ở Backend: trả sách bình thường kích hoạt người `PENDING` đầu tiên thành `AVAILABLE` trong 72 giờ; job mặc định quét mỗi 60 giây theo lô 100 để hết hạn và chuyển lượt; hủy/giao thành công sắp lại hàng đợi và kích hoạt người kế tiếp. Chỉ lượt `AVAILABLE` đứng đầu, còn hạn mới được giao; mượn thường không được lấy bản đang dành cho người nhận. Không đổi schema, không gửi email/chuông ở V1. Xem [báo cáo BE-2](../docs/BE2_RESERVATION_LIFECYCLE.md).

**BE-4 (02/11/2026, đã triển khai code và qua unit baseline):** Mật khẩu đăng ký/reset yêu cầu 8–72 ký tự; token reset cũ của tài khoản bị xóa trước khi tạo token mới dưới khóa ghi; profile trả `UserDTO` và không serialize mật khẩu; bulk tạo sách dùng một transaction cho toàn lô. Không đổi schema. Sửa hồ sơ, đổi mật khẩu khi đăng nhập và rate limit quên mật khẩu để ngoài V1. Full unit/context/H2 suite ở BE-5 đạt; contract/E2E MySQL test còn chờ database `_test`. Xem [báo cáo BE-4](../docs/BE4_ACCOUNT_BOOKS.md).

**BE-5 (02/11/2026, đã triển khai hạ tầng):** `mvn test` dùng H2 cô lập và không còn nối `library_db1`; mapping năm xuất bản dùng JDBC `SMALLINT` nên các test atomicity H2 chạy được. Hai profile Failsafe `mysql-contract` và `mysql-e2e` chỉ nhận database có tên kết thúc `_test`, từ chối database chính trước khi tạo fixture. Full unit/context/H2 suite đạt; chưa chạy MySQL IT vì môi trường chưa cấu hình `TEST_DB_URL`/`TEST_DB_USERNAME`. Xem [hướng dẫn BE-5](../docs/BE5_TEST_INFRASTRUCTURE.md).

**RB-7 (10/11/2026, nghiệm thu code và đồng bộ tài liệu):** `mvn test` đạt 199/199; Frontend đạt 104/104 test và production build. Backend local trả lời HTTP; request ẩn danh tới `/api/books` bị 403 theo cấu hình JWT. Không chạy MySQL end-to-end trên `library_db1`: Failsafe bắt buộc database riêng hậu tố `_test`, chưa có cấu hình test DB; không tạo dữ liệu thử trên database chính. Vì chưa có test MySQL E2E với fixture, RB-7 chưa được xác nhận hoàn tất toàn luồng. Chi tiết ở [fix-returnbook.md](../docs/fix-returnbook.md).

**AD5 (08/10/2026, cập nhật BE-2 ngày 31/10/2026):** `/admin/reservations` tra cứu toàn hệ thống qua `POST /api/reservations/search` (lọc user/sách/trạng thái/hàng đợi, phân trang server), xem hàng đợi theo sách, tạo cho user, hủy và xác nhận giao sách. `fulfill` chỉ ADMIN ở cả HTTP và service; USER chỉ xem/hủy lượt của mình. BE-2 đã bổ sung tự chuyển `PENDING → AVAILABLE` khi sách được trả, cửa sổ nhận 72 giờ, job tự hết hạn/chuyển lượt và guard không cho mượn thường lấy bản đang được giữ. Không đổi schema; email/chuông thông báo vẫn để sau V1.

**AD6 (08/10/2026, cập nhật AUD2-BE-04 ngày 13/11/2026):** `/admin/subscriptions/plans` đọc các gói và cho thêm gói giá nguyên VND; `/admin/subscriptions/members` tra cứu đăng ký theo user/gói/cờ hiệu lực và phân trang tại database. USER `GET /api/subscription-plans` chỉ nhận gói đang hiển thị, không nhận ghi chú/người tạo quản trị. DELETE xóa cứng nếu chưa từng có đăng ký; nếu có bất kỳ lịch sử nào, API trả HTTP 409 và giữ nguyên gói, trạng thái cùng lịch sử. ADMIN chỉ sửa hoặc xóa gói; không có thao tác ngừng bán. Update có validation, job hết hạn dùng POST và danh sách ADMIN cũ dùng phân trang database thật. Không có kích hoạt subscription thủ công thay payOS; user có gói active không mua chồng, hủy xong được mua mới. Không đổi schema.

**AD7 (08/10/2026):** `/admin/fines` đọc danh sách tiền phạt lọc/phân trang server, xem chi tiết, tạo theo ID lượt mượn và miễn phần còn nợ với lý do. `/admin/payments` đọc danh sách giao dịch phân trang, xem chi tiết, kiểm tra trạng thái từ backend và cho đối soát payOS sau xác nhận **chỉ khi** `VITE_PAYMENTS_ENABLED=true` và đơn PAYOS/VND loại FINE hoặc MEMBERSHIP đang chờ. Không có nút hoàn tiền, tự đặt SUCCESS/PAID hoặc tạo giao dịch từ ADMIN. Adapter frontend không giữ `gatewaySignature` trong dữ liệu hiển thị. Backend giới hạn trang tiền phạt 1–100 bản ghi. **63/63 test frontend, lint, build và bộ Maven không cần MySQL đạt; test quyền HTTP AD7 đạt.** MySQL `localhost:3306` chưa kết nối được, nên chưa nghiệm thu thao tác ghi/đọc lại trên DB chính hoặc đối soát thật; không gọi payOS thật và không đổi schema/dữ liệu.

**AD8 (08/10/2026):** `/admin/reviews` tra cứu phân trang server theo ID người dùng, ID sách và trạng thái; xem đầy đủ đánh giá đang hiển thị/đã ẩn, xác nhận trước khi ẩn. Backend thêm `GET /api/reviews/admin` và `POST /api/reviews/admin/{id}/hide`, chặn USER ở HTTP lẫn service; thao tác ẩn chỉ đổi `is_active`, không sửa điểm/nội dung và gọi lại không ghi thêm. Danh sách USER theo sách vẫn chỉ trả đánh giá đang hiển thị. Đã chốt V1 **không lưu người/lý do/thời điểm kiểm duyệt riêng**, không đổi MySQL. Topbar có lựa chọn “Thoáng/Gọn” lưu cục bộ ở trình duyệt; chuông vẫn chưa có API thông báo nên không tạo số giả. **66/66 test frontend, lint và build đạt; bộ Maven không cần MySQL, test AD8 quyền HTTP/service/truy vấn H2 đạt.** MySQL `127.0.0.1:3306` chưa kết nối được nên chưa nghiệm thu ghi/đọc trên DB chính hoặc UI bằng phiên ADMIN thật. Do ràng buộc unique user–book hiện có, ẩn đánh giá không mở quyền tạo đánh giá thứ hai cho cùng sách.

**AD9 (08/10/2026):** Đã kiểm tra lại build/test, quyền và hợp đồng API AD0–AD8; kết quả **backend `clean compile` và package đạt, 109/109 test không cần MySQL đạt; frontend 66/66 test, lint, build đạt**. `mvn test` đầy đủ có 1 lỗi context vì MySQL `library_db1` đang không kết nối; backend/frontend không chạy ở localhost nên chưa thể nghiệm thu API, thao tác DB và responsive bằng phiên thật. Kết quả từng module, giới hạn và điều kiện đóng ở [báo cáo AD9](../docs/AD9_ADMIN_ACCEPTANCE.md). Không đổi schema hoặc dữ liệu MySQL, không gọi payOS.

| Đợt | Trang/chức năng | API hiện có và việc cần xử lý | Điều kiện hoàn thành |
|---|---|---|---|
| **AD0 — Nền ADMIN** | Layout, Sidebar/Topbar, route, quyền, chuyển giao diện | Dùng Auth/JWT hiện có; điều chỉnh guard để ADMIN vào khu USER bằng chính tài khoản của mình. Không thêm role hay API chỉ vì đổi giao diện. | `/admin` điều hướng đúng; USER bị chặn; ADMIN đổi hai khu không đăng nhập lại; mobile/menu hoạt động. |
| **AD1 — Dashboard** | Thẻ số liệu và liên kết nghiệp vụ, không làm biểu đồ giả | `GET /api/books/stats` và `totalElements` từ `POST /api/book-loans/search`; chưa hiển thị tổng user/fine/payment khi thiếu API tổng đã nghiệm thu. Không cộng một trang phân trang thành tổng. | Số liệu truy vết được tới API; loading/rỗng/lỗi; không hiển thị doanh thu ước đoán. |
| **AD2 — Sách & Thể loại** | Danh sách, chi tiết, thêm/sửa; cây thể loại; xóa cứng sách khi chưa có liên kết | **Đã triển khai mã.** API ADMIN đọc cả sách ẩn; cập nhật tồn kho dùng khóa hàng; chu trình thể loại bị chặn. FK chặn xóa cứng khi còn dữ liệu liên quan và API trả HTTP 409. | Đã qua unit/API-role test. Còn nghiệm thu ghi/đồng thời và UI bằng ADMIN thật trước khi coi là hoàn tất vận hành. |
| **AD3 — Người dùng** | Danh sách, tìm/lọc, xem thông tin cơ bản | **Đã triển khai V1 chỉ đọc** qua `GET /api/users/list`; phân trang/tìm kiếm thực hiện ở frontend. Chưa có API chi tiết/phân trang phía server hoặc khóa tài khoản. | Đã qua test vai trò và không lộ mật khẩu. Còn nghiệm thu UI bằng ADMIN thật; dữ liệu lớn cần API phân trang riêng trước vận hành quy mô lớn. |
| **AD4 — Mượn–trả** | Tra cứu, chi tiết, cấp/trả/gia hạn theo quyền, quá hạn | **Đã triển khai mã.** Dùng API hiện có; batch quá hạn xử lý nhiều lô theo ID. Không tự thêm tính phạt, không có Sửa/Xóa bản ghi mượn. | Đã qua test UI/API/quyền và H2. Còn nghiệm thu ghi/đọc lại trên MySQL chính, lỗi hạn mức/tồn kho và giao diện ADMIN thật trước khi coi là hoàn tất vận hành. |
| **AD5 — Đặt giữ** | Danh sách toàn hệ thống, hàng đợi, tạo/hủy, xác nhận giao sách | **Đã triển khai mã và hoàn thiện vòng đời ở BE-2.** `fulfill` chỉ ADMIN, chỉ lượt `AVAILABLE` đứng đầu và còn hạn; trả/hủy/giao/hết hạn tự chuyển hàng đợi. Chưa gửi email/chuông. | Unit/service/security test đạt; ca MySQL opt-in đã có nhưng chỉ chạy trên database thử nghiệm rỗng. Còn nghiệm thu UI ADMIN thật và thông báo nếu đưa vào phạm vi sau V1. |
| **AD6 — Gói thành viên** | Hai tab Các gói / Thành viên đăng ký | USER chỉ thấy gói đang hiển thị; ADMIN sửa/xóa. DELETE xóa plan chưa dùng, trả HTTP 409 nếu có lịch sử; không đổi trạng thái hoặc lịch sử. Danh sách đăng ký phân trang thật; tác vụ hết hạn dùng POST. | Backend/UI đã được đồng bộ theo AUD2-BE-04; kiểm chứng lại test và runtime còn chờ. Không đổi schema. |
| **AD7 — Tiền phạt & Thanh toán** | Fine list/detail/create/waive; payment list/detail/status/đối soát | **Đã triển khai mã** trên API thật. Miễn chỉ phần còn nợ; đối soát chỉ bật theo cấu hình môi trường và bằng chứng payOS. Không có refund hoặc nút tự đánh dấu đã thanh toán. Giữ payOS tạo đơn tắt tới khi đủ điều kiện an toàn. | Test API frontend, phân quyền HTTP, lint/build đạt. Còn nghiệm thu ghi/đọc MySQL chính, UI bằng ADMIN thật và đối soát staging; không thử tiền thật. |
| **AD8 — Đánh giá & Topbar** | Danh sách/chi tiết review, ẩn vi phạm; chuông và cài đặt giao diện | **Đã triển khai mã** API ADMIN search/hide và giao diện; ADMIN không sửa nội dung review. V1 chốt không lưu dấu vết kiểm duyệt riêng, không đổi schema. Chuông chưa có API; mật độ hiển thị chỉ lưu ở frontend. | Test API/quyền/frontend và build đạt; còn nghiệm thu MySQL/UI thật. Review ẩn không hiện ở USER; không có thông báo/số đếm giả. |
| **AD9 — Nghiệm thu ADMIN** | Kiểm thử xuyên USER–ADMIN–Backend–MySQL, responsive và tài liệu vận hành | **Đã kiểm thử tự động và lập báo cáo; chưa đóng end-to-end.** MySQL/backend/frontend đang tắt, nên chưa thử phiên thật hoặc ghi DB chính. PayOS thật và thay đổi schema không nằm trong lượt kiểm tra. | [Báo cáo pass/fail/tồn đọng](../docs/AD9_ADMIN_ACCEPTANCE.md); chỉ đóng khi có startup, API/DB và responsive thực tế. |

## Các quyết định phạm vi đã chốt

| Lúc nào | Vấn đề cụ thể | Phương án và tác động |
|---|---|---|
| **AD6 — nút xóa gói** | Một gói có thể đã được đăng ký và thanh toán, nên xóa thật sẽ làm mất mốc lịch sử hoặc bị FK chặn. | **Quy tắc hiện hành (AUD2-BE-04):** gói chưa từng có đăng ký được xóa cứng; nếu có lịch sử thì từ chối xóa rõ ràng, giữ nguyên trạng thái và dữ liệu. Không có chức năng ngừng bán. |
| **AD8 — nút ẩn đánh giá vi phạm** | `book_reviews` có `is_active`, không có người/lý do/thời điểm **kiểm duyệt** riêng. | **Đã chốt V1 tối giản:** ADMIN chỉ ẩn review và không sửa nội dung USER; không lưu đầy đủ ai ẩn/vì sao, không đổi schema. Nếu sau này cần truy vết, phải thiết kế API và báo thay đổi DB nhỏ trước khi ALTER. |

**Đề xuất phạm vi V1, không phải quyết định gấp:** AD3 chỉ xem/tìm người dùng, chưa khóa tài khoản hoặc đổi vai trò; AD1 chỉ hiển thị số liệu có API tổng chính xác, không dựng biểu đồ/doanh thu giả. Nếu muốn quản lý tài khoản nâng cao hoặc báo cáo chuyên sâu, cần chốt nghiệp vụ và API riêng trước khi code.

Không DROP/TRUNCATE hoặc tạo lại schema; ưu tiên backend tương thích MySQL đang dùng. Khi một đợt cần đổi DB, dừng để giải thích và chốt thay đổi nhỏ nhất trước. Khóa JWT/DB/mail/payOS đã lộ phải được thay và chuyển sang cấu hình an toàn trước khi đưa hệ thống ra Internet hoặc nhận thanh toán thật.

## Tài liệu tra cứu

- [Nhật ký chi tiết trước khi rút gọn](README_HISTORY.md)
- [Tài liệu nghiệp vụ gốc](../docs/Library_Management_System_VI.md)
- [Bảng đối chiếu code/test Bước 6](../docs/STEP6_TRACEABILITY.md)
- [Final Review Bước 7 và rủi ro còn mở](../docs/STEP7_FINAL_REVIEW.md)
