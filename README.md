# Library Management System

Backend Spring Boot + MySQL `library_db1`; frontend React/Vite tại [`.mvn/frontend/library-frontend`](.mvn/frontend/library-frontend). Giao diện tiếng Việt, màu chính `#1769ff`.

## Đang ở đâu?

| Chặng | Trạng thái ngày 08/10/2026 |
|---|---|
| Backend + MySQL | Đã thực hiện B0 và Bước 1–7 theo phạm vi từng đợt; **chưa nghiệm thu toàn bộ**. Xem bảng Backend ngay dưới và [báo cáo Bước 7](../docs/STEP7_FINAL_REVIEW.md). |
| USER (F0–F4C) | Đã dựng và nối frontend theo module. Lần kiểm tra F4C: 37/37 test, lint và build đạt. Chưa nghiệm thu toàn bộ luồng USER bằng tài khoản thật trên MySQL chính. |
| Thanh toán payOS/VietQR | UI QR/link và tra trạng thái backend đã có; **tạo đơn và giao dịch thật vẫn tắt mặc định**. Cần khóa mới an toàn, webhook HTTPS, staging và phê duyệt thử tiền thật. |
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
| Bước 6 — API + Database | 6A–6F đã sửa/kiểm thử theo từng nhóm; 6G–6H có các lượt MySQL và live HTTP chọn lọc. Bước 7 chạy **104 test API MySQL rollback** đạt; sau lượt đó 12 bảng kiểm tra đều 0 dòng. | Không phải toàn bộ giao dịch thật hay mọi nhánh đồng thời. `mvn test` mặc định không tự chạy các lớp `*IT`. |
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

Lưu ý trước khi dùng AD4 với dữ liệu thật: logic backend hiện **cộng bản `DAMAGED` lại vào số bản sẵn** và **đặt `overdueDays=0` khi trả sách**. AD4 giữ nguyên các quy tắc cũ; cần chốt cách xử lý tồn kho sách hư và lưu lịch sử ngày trễ trước khi thay đổi nghiệp vụ.

**AD5 (08/10/2026):** `/admin/reservations` tra cứu toàn hệ thống qua `POST /api/reservations/search` (lọc user/sách/trạng thái/hàng đợi, phân trang server), xem hàng đợi theo sách, tạo cho user, hủy và xác nhận giao sách. `fulfill` chỉ ADMIN ở cả HTTP và service; backend khóa sách, kiểm tra lại tồn kho và chỉ giao cho người đầu hàng. USER vẫn xem/hủy đặt giữ của mình nhưng không còn nút/API tự xác nhận nhận sách. Test tích hợp MySQL cũ được cập nhật theo quyền mới. **57/57 test frontend, lint, build; test HTTP/phân quyền, H2 và bộ Maven không cần MySQL đạt.** MySQL `localhost:3306` hiện không kết nối được nên chưa nghiệm thu ghi/đọc lại trên DB chính hoặc màn hình bằng phiên ADMIN thật. Không đổi schema/dữ liệu MySQL. Hệ thống hiện chưa có job/email tự chuyển `PENDING → AVAILABLE` hoặc tự hết hạn; ADMIN có thể xác nhận lượt `PENDING` đầu hàng khi sách đã có bản sẵn, còn các bước tự động là phạm vi riêng chưa triển khai.

**AD6 (08/10/2026):** `/admin/subscriptions/plans` đọc cả gói đang bán/ngừng bán và cho thêm gói giá nguyên VND; `/admin/subscriptions/members` tra cứu đăng ký theo user/gói/cờ hiệu lực và phân trang tại database. USER `GET /api/subscription-plans` chỉ còn nhận gói đang bán, không nhận ghi chú/người tạo quản trị; ADMIN dùng `GET /api/subscription-plans/admin` và `GET /api/subscriptions/admin/search`. Chưa có nút sửa, xóa cứng, ngừng/mở bán hoặc kích hoạt đăng ký thủ công trên UI trong lúc chờ chốt phạm vi thao tác AD6. API DELETE gói cũ vẫn xóa cứng; không dùng API này để ngừng bán. **60/60 test frontend, lint, build và bộ Maven không cần MySQL đạt; test quyền HTTP/truy vấn H2 AD6 đạt.** MySQL `localhost:3306` chưa kết nối được nên chưa nghiệm thu trên DB chính hoặc giao diện bằng phiên ADMIN thật. Không đổi schema/dữ liệu MySQL.

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
| **AD5 — Đặt giữ** | Danh sách toàn hệ thống, hàng đợi, tạo/hủy, xác nhận giao sách | **Đã triển khai mã.** Thêm API ADMIN search; `fulfill` chỉ ADMIN và chỉ người đầu hàng; bỏ tự xác nhận ở USER. Chưa có tự chuyển `AVAILABLE`/thông báo/hết hạn. | Đã qua test USER ↔ ADMIN, hàng đợi, rollback/tồn kho trên H2 và frontend. Còn nghiệm thu ghi trên MySQL chính, giao diện ADMIN thật và luồng thông báo/trạng thái tự động trước vận hành đầy đủ. |
| **AD6 — Gói thành viên** | Hai tab Các gói / Thành viên đăng ký | **Đã triển khai xem/thêm gói và tra cứu đăng ký phân trang server.** USER chỉ thấy gói đang bán. Chờ chốt thao tác thay đổi gói; UI chưa có Sửa/Xóa/ngừng-mở bán và không kích hoạt gói thủ công thay payOS. | Đã qua test frontend, quyền HTTP và H2. Còn nghiệm thu MySQL/UI thật; API DELETE cũ vẫn xóa cứng nên không dùng để ngừng bán. |
| **AD7 — Tiền phạt & Thanh toán** | Fine list/detail/create/waive; payment list/detail/status/đối soát | **Đã triển khai mã** trên API thật. Miễn chỉ phần còn nợ; đối soát chỉ bật theo cấu hình môi trường và bằng chứng payOS. Không có refund hoặc nút tự đánh dấu đã thanh toán. Giữ payOS tạo đơn tắt tới khi đủ điều kiện an toàn. | Test API frontend, phân quyền HTTP, lint/build đạt. Còn nghiệm thu ghi/đọc MySQL chính, UI bằng ADMIN thật và đối soát staging; không thử tiền thật. |
| **AD8 — Đánh giá & Topbar** | Danh sách/chi tiết review, ẩn vi phạm; chuông và cài đặt giao diện | **Đã triển khai mã** API ADMIN search/hide và giao diện; ADMIN không sửa nội dung review. V1 chốt không lưu dấu vết kiểm duyệt riêng, không đổi schema. Chuông chưa có API; mật độ hiển thị chỉ lưu ở frontend. | Test API/quyền/frontend và build đạt; còn nghiệm thu MySQL/UI thật. Review ẩn không hiện ở USER; không có thông báo/số đếm giả. |
| **AD9 — Nghiệm thu ADMIN** | Kiểm thử xuyên USER–ADMIN–Backend–MySQL, responsive và tài liệu vận hành | **Đã kiểm thử tự động và lập báo cáo; chưa đóng end-to-end.** MySQL/backend/frontend đang tắt, nên chưa thử phiên thật hoặc ghi DB chính. PayOS thật và thay đổi schema không nằm trong lượt kiểm tra. | [Báo cáo pass/fail/tồn đọng](../docs/AD9_ADMIN_ACCEPTANCE.md); chỉ đóng khi có startup, API/DB và responsive thực tế. |

## Hai quyết định cần chốt trước khi làm nút tương ứng

| Lúc nào | Vấn đề cụ thể | Phương án và tác động |
|---|---|---|
| **AD6 — nút xóa gói** | Một gói đã có người đăng ký và thanh toán. API `DELETE /api/subscription-plans/admin/{id}` hiện **xóa bản ghi thật**; xóa có thể bị FK chặn hoặc làm mất điểm tham chiếu lịch sử. | **Đề xuất V1: “Ngừng bán”** bằng `isActive=false`, giữ gói và các đăng ký cũ. Backend đã chặn tạo đơn cho gói inactive; từ AD6 danh sách USER cũng chỉ trả gói đang bán. Nếu muốn xóa cứng gói chưa từng được dùng, cần chốt điều kiện và test FK riêng trước khi đưa nút lên UI. |
| **AD8 — nút ẩn đánh giá vi phạm** | `book_reviews` có `is_active`, không có người/lý do/thời điểm **kiểm duyệt** riêng. | **Đã chốt V1 tối giản:** ADMIN chỉ ẩn review và không sửa nội dung USER; không lưu đầy đủ ai ẩn/vì sao, không đổi schema. Nếu sau này cần truy vết, phải thiết kế API và báo thay đổi DB nhỏ trước khi ALTER. |

**Đề xuất phạm vi V1, không phải quyết định gấp:** AD3 chỉ xem/tìm người dùng, chưa khóa tài khoản hoặc đổi vai trò; AD1 chỉ hiển thị số liệu có API tổng chính xác, không dựng biểu đồ/doanh thu giả. Nếu muốn quản lý tài khoản nâng cao hoặc báo cáo chuyên sâu, cần chốt nghiệp vụ và API riêng trước khi code.

Không DROP/TRUNCATE hoặc tạo lại schema; ưu tiên backend tương thích MySQL đang dùng. Khi một đợt cần đổi DB, dừng để giải thích và chốt thay đổi nhỏ nhất trước. Khóa JWT/DB/mail/payOS đã lộ phải được thay và chuyển sang cấu hình an toàn trước khi đưa hệ thống ra Internet hoặc nhận thanh toán thật.

## Tài liệu tra cứu

- [Nhật ký chi tiết trước khi rút gọn](README_HISTORY.md)
- [Tài liệu nghiệp vụ gốc](../docs/Library_Management_System_VI.md)
- [Bảng đối chiếu code/test Bước 6](../docs/STEP6_TRACEABILITY.md)
- [Final Review Bước 7 và rủi ro còn mở](../docs/STEP7_FINAL_REVIEW.md)
