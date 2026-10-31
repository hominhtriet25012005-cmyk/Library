# Nhật ký Library — README trước khi rút gọn (08/10/2026)

Backend Java Spring Boot dùng MySQL `library_db1`; thanh toán dự kiến dùng payOS + VietQR bằng VND. Frontend React/Vite hiện ở [`.mvn/frontend/library-frontend`](.mvn/frontend/library-frontend); route `/user/...` đang nối API thật theo từng module, còn `/demo/...` chỉ dùng dữ liệu mẫu.

## Lộ trình Frontend — chốt phạm vi ngày 06/10/2026

### Trạng thái và nguyên tắc triển khai

- Từ F1, giao diện tiếp tục dùng tiếng Việt; màu chủ đạo do project chọn là `#1769ff` (thay cho xanh lục lam của F0). Giữ mã trạng thái/API bằng tiếng Anh ở tầng dữ liệu và chỉ dịch khi hiển thị.
- F1 đã thêm Auth/API client, route `/` PUBLIC tối thiểu, `/user/...` bảo vệ ROLE_USER, `/admin` bảo vệ ROLE_ADMIN và hồ sơ đọc từ API. F2 đã nối `/user/books` và chi tiết sách với API/MySQL; F3A đã nối Wishlist; F3B đã nối Mượn/trả/gia hạn; F3C đã nối Đặt giữ; F3D đã nối Đánh giá sách. F4A đã có trang xem gói/gói đang dùng, chọn gói và hủy. F4B đã nối Tiền phạt của USER và số dư trên Dashboard. F4C đã dựng luồng QR/payOS và xác nhận trạng thái từ backend, nhưng **tạo đơn/giao dịch thật vẫn tắt mặc định**. `/demo/...` tiếp tục là bản xem thử không cần đăng nhập và chỉ dùng dữ liệu mẫu.
- Sau khi cài lại `node_modules`, Vite hoạt động nhưng `npm run build` còn dừng tại import `MyReservation` sai đường dẫn (`MyReservation` so với thư mục `My Reservation`); `npm run lint` báo 78 lỗi, gồm cả import thừa và lỗi biến chưa khai báo. Đây là mốc **trước khi sửa**, không phải kết quả nghiệm thu Frontend.
- Giữ UI đang có, sửa theo nhóm nhỏ và nghiệm thu từng giai đoạn. Mỗi module đi hết vòng: giao diện → API thật → hiển thị dữ liệu → thao tác → loading/error/success → kiểm thử. Không coi màn chỉ có dữ liệu mẫu là hoàn thành.
- Phạm vi USER dưới đây bám API backend hiện có. Chức năng ghi trong tài liệu nhưng chưa có API được ghi thành khoảng trống riêng, không tạo nút giả hoặc tự thay đổi nghiệp vụ.
- Route đã bố trí: `/` PUBLIC tối thiểu, `/user/...` cho USER, `/admin` cho ADMIN (trang chờ F5); URL USER cũ (`/books`, `/my-loans`, v.v.) chuyển tiếp sang route mới.

### Phạm vi USER đã chốt

| Module | Trang/khu vực | Nội dung và thao tác cần hoàn thành | Backend hiện có / giới hạn |
|---|---|---|---|
| Tài khoản | Đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu | Form, validation, thông báo lỗi; sau đăng nhập vào USER; đăng xuất xóa phiên phía frontend | `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password` |
| Hồ sơ | Hồ sơ của tôi | Xem họ tên, email, số điện thoại và thông tin tài khoản; đăng xuất | `GET /api/users/profile`; chưa có API sửa hồ sơ/đổi mật khẩu khi đã đăng nhập |
| Dashboard | Tổng quan USER | Tóm tắt lượt mượn, quá hạn, đặt giữ, tiền phạt và gói đang dùng; liên kết sang các module | Tổng hợp từ các API hiện có; reading goal/streak đang là mẫu và chưa có nguồn dữ liệu backend |
| Sách & thể loại | Danh sách sách | Sách, ảnh bìa, tác giả, thể loại, tồn kho; tìm, lọc, sắp xếp và phân trang | `GET /api/books`, `POST /api/books/search`, `GET /api/genres`; yêu cầu JWT hiện hành |
| Sách & thể loại | Chi tiết sách | Thông tin đầy đủ, đánh giá; thao tác mượn, đặt giữ hoặc thêm Wishlist tùy điều kiện | Backend chưa expose `GET /api/books/{id}`; cần chốt bổ sung API nếu hỗ trợ URL chi tiết độc lập |
| Wishlist | Sách yêu thích | Xem danh sách; thêm/xóa từ trang sách; xem ghi chú và mở sách | API xem/thêm/xóa Wishlist hiện có |
| Mượn/trả/gia hạn | Sách của tôi, chi tiết khoản mượn | Các tab Đang mượn/Quá hạn/Đã trả/Mất/Hư hỏng; hạn trả, số lần gia hạn, thao tác trả/gia hạn khi đủ điều kiện | API `/api/book-loans/my`, checkout, checkin, renew hiện có; chưa có GET riêng theo loan ID |
| Đặt giữ sách | Đặt giữ của tôi, tạo đặt giữ | Trạng thái, vị trí hàng đợi, thời gian nhận, hủy khi được phép; tạo từ sách hết bản | API `/api/reservations/my`, tạo/hủy/fulfill hiện có; điều kiện nhận sách và vai trò thao tác fulfill cần thể hiện đúng backend |
| Đánh giá | Khu đánh giá trong chi tiết sách | Xem review; người đã hoàn tất lượt mượn tạo/sửa/xóa mềm review của mình | API theo sách và tạo/sửa/xóa có; chưa có API “mọi đánh giá của tôi” riêng |
| Gói thành viên | Danh sách gói, gói của tôi | Giá VND, thời hạn, hạn mức; xem gói active, chọn mua và hủy khi hợp lệ | API danh sách gói, active, subscribe, cancel có; chưa có API lịch sử/gia hạn gói như tài liệu mô tả |
| Tiền phạt | Tiền phạt của tôi | Lọc trạng thái/loại, số tiền đã trả/còn nợ, lý do và khoản mượn liên quan; mở thanh toán | `GET /api/fines/my`, `POST /api/fines/{id}/pay` |
| Thanh toán | QR/checkout, trạng thái kết quả | Hiển thị số tiền VND, QR/link payOS, mã đơn; hỏi backend về trạng thái sau khi quay lại; không tự xác nhận thành công từ redirect | API trạng thái/đối soát theo payment ID có; chưa có lịch sử payment riêng cho USER; payOS tạo đơn mặc định đang tắt |

Ngoài phạm vi USER phiên đầu: sửa hồ sơ, đổi mật khẩu trong tài khoản, lịch sử/gia hạn gói, reading goal/streak, trang “mọi review của tôi” và lịch sử thanh toán USER. Các mục này cần hợp đồng API hoặc quyết định nghiệp vụ riêng trước khi thêm vào kế hoạch code.

### Ranh giới USER và ba điểm cần chốt

**F0–F4C là chặng USER:** F0 sửa nền giao diện đang có; F1 làm Tài khoản/Auth và API dùng chung; F2 làm Sách/Thể loại; F3A–F3D lần lượt làm Wishlist → Mượn/trả → Đặt giữ → Đánh giá; F4A–F4C làm Gói thành viên → Tiền phạt → Thanh toán. Nền F1 được tái sử dụng khi làm ADMIN ở F5. Dashboard USER được nối số liệu dần sau mỗi module, không coi các chỉ số mẫu hiện tại là dữ liệu thật. F5 là ADMIN, F6 là PUBLIC, F7 là nghiệm thu tổng thể.

1. **Chi tiết sách thuộc USER phiên đầu.** Nếu cần mở trực tiếp `/user/books/{id}` và tải lại trang vẫn có dữ liệu, backend hiện thiếu `GET /api/books/{id}`; phải chốt bổ sung API nhỏ này trước khi nghiệm thu F2. **Lịch sử thanh toán USER chưa thuộc phiên đầu** vì backend chỉ có danh sách payment dành cho ADMIN và tra trạng thái theo payment ID. Nếu bạn muốn lịch sử USER, cần bổ sung API và thêm một nhóm việc riêng.
2. **Sửa hồ sơ, lịch sử/gia hạn gói, reading goal/streak** để sau phiên USER đầu. Trang hồ sơ phiên đầu chỉ đọc; Dashboard chỉ hiển thị chỉ số suy ra được từ API thật. Không dựng nút hay số liệu giả cho các chức năng chưa có backend.
3. **Quy tắc mua thêm gói đã chốt ở F4A:** từ chối khi đang có gói active; nếu người dùng chủ động hủy sớm thì quyền gói dừng ngay và có thể mua gói mới. Backend kiểm tra ở tạo đơn và settlement để không tự kích hoạt hai gói cùng lúc. F4C có thể dựng/test giao diện với gateway giả lập, nhưng chưa bật thanh toán thật khi các điều kiện payOS và kiểm thử chưa hoàn tất.

### Các giai đoạn thực hiện

| Giai đoạn | Phạm vi | Điều kiện nghiệm thu trước khi chuyển giai đoạn |
|---|---|---|
| **F0 — Ổn định frontend hiện có** | Sửa import/đường dẫn/cú pháp/biến chưa khai báo; render Dashboard, Books, My Loans, My Reservations; sửa tương tác UI cơ bản đang lỗi | `npm run build` và `npm run lint` đạt; bốn màn mở được với dữ liệu mẫu, không lỗi runtime rõ ràng |
| **F1 — Auth và nền API** | API client, JWT, login/signup/reset, profile GET, logout, route PUBLIC/USER/ADMIN và trang 403/404 tối thiểu | Đăng nhập thật, gọi profile thật; refresh và logout đúng; route được bảo vệ; kiểm tra quyền ở frontend lẫn phản hồi backend |
| **F2 — Sách & thể loại USER** | Thay mẫu bằng API, tìm/lọc/sắp xếp/phân trang; BookCard và chi tiết sách | Dữ liệu lấy qua backend/MySQL; trạng thái loading/rỗng/lỗi đúng; chốt và xử lý khoảng trống GET book ID nếu dùng URL chi tiết |
| **F3A — Wishlist** | Danh sách, thêm/xóa, đồng bộ trạng thái nút trên sách | Thao tác phản ánh dữ liệu backend sau tải lại trang |
| **F3B — Mượn/trả/gia hạn** | Danh sách, tab trạng thái, chi tiết và các action được phép | Kiểm tra điều kiện gói/hạn mức/hạn trả, kết quả từ backend và thay đổi dữ liệu sau action |
| **F3C — Đặt giữ** | Tạo, xem hàng đợi, hủy, trạng thái có thể nhận/hoàn tất | Test sách hết bản, trùng đặt giữ, giới hạn, quyền và trạng thái; không suy diễn thêm nghiệp vụ |
| **F3D — Đánh giá** | Xem theo sách, tạo/sửa/xóa review của mình | Chỉ người đủ điều kiện thao tác; hiển thị lỗi backend và trạng thái sau xóa mềm |
| **F4A — Gói thành viên** | Danh sách gói, gói active, chọn mua/hủy | Chốt và xử lý chính sách mua khi đã có gói active trước khi cho thanh toán thật |
| **F4B — Tiền phạt** | Danh sách/lọc, chi tiết, mở luồng thanh toán | Phân biệt chưa trả, đang xử lý, đã trả/miễn; không cho thao tác trái trạng thái |
| **F4C — Thanh toán payOS/VietQR** | QR/link, trạng thái chờ, trang kết quả; đồng bộ lại từ backend | Test với gateway giả lập/không nhận tiền trước; chỉ thử tiền thật khi backend, secret và webhook HTTPS đã sẵn sàng |
| **F5 — ADMIN** | Dùng lại Auth/API client; làm theo nhóm Dashboard → sách/thể loại → người dùng → mượn/đặt giữ → gói/phạt/payment | Mỗi nhóm có kiểm tra quyền ADMIN/USER. Trước màn sửa tồn kho, xử lý rủi ro catalog–loan trong review Bước 7. Không mặc định có review moderation/thống kê nếu backend chưa expose |
| **F6 — PUBLIC** | Landing, giới thiệu, đăng nhập/đăng ký và nội dung xem trước được duyệt; cấu trúc route đã chừa từ F1 | Trang không cần đăng nhập hoạt động. Nếu muốn dữ liệu sách/gói thật công khai, phải chốt quyền backend vì `/api/**` hiện yêu cầu xác thực |
| **F7 — Nghiệm thu và triển khai** | Responsive, trải nghiệm nâng cao, luồng end-to-end USER/ADMIN/PUBLIC, build, cấu hình môi trường và deployment | Build/lint, luồng trình duyệt–API–MySQL đạt; payOS thực chỉ bật sau kiểm tra bảo mật, webhook và quy trình đối soát |

**Nhịp báo cáo:** triển khai một giai đoạn hoặc nhóm F3/F4/F5 mỗi lượt; báo file thay đổi, API đã nối, cách kiểm tra, kết quả và tồn đọng rồi mới chuyển nhóm. Loading, lỗi, xác nhận thao tác và trạng thái rỗng được làm cùng module; F7 chỉ hoàn thiện trải nghiệm và nghiệm thu tổng thể.

**Kết quả F0 (06/10/2026):** Đã sửa lỗi import/cú pháp khiến frontend không build hoặc không render, nối lại bốn màn với dữ liệu mẫu, sửa tab/lọc/tìm sách và điều hướng di động, bỏ số liệu mẫu mâu thuẫn với phạm vi đã chốt. `npm run lint` và `npm run build` đều đạt; đã mở và thao tác bốn màn trên trình duyệt localhost. Build còn cảnh báo từ dependency MUI/React Router (`use client`) và bundle khoảng 599 kB; đây chưa phải lỗi build. Chưa nối API/backend, chưa làm Auth hoặc thanh toán.

**Kết quả F1 (06/10/2026):** Đã triển khai đăng nhập, đăng ký, quên/đặt lại mật khẩu, hồ sơ chỉ đọc, đăng xuất phía frontend, API client Bearer JWT, kiểm tra lại hồ sơ khi tải lại trang, route theo ROLE_USER/ROLE_ADMIN và trang 403/404. Token nằm trong `sessionStorage` (đóng tab là hết phiên); 401 xóa phiên, 403 không xóa phiên. Vite proxy `/auth` và `/api` tới backend localhost:8000 khi chạy `npm run dev`; production cần reverse proxy cùng origin hoặc cấu hình `VITE_API_BASE_URL` và CORS phù hợp. Đã xác minh `npm test`, `npm run lint`, `npm run build`, route công khai/bảo vệ trên trình duyệt, backend startup và MySQL với `ddl-auto=validate`; chưa nghiệm thu luồng đăng nhập/đăng ký thành công bằng tài khoản thật vì chưa có tài khoản thử nghiệm được chỉ định và không tự tạo dữ liệu trong database chính. Trước khi triển khai Internet cần xử lý cảnh báo bảo mật backend về secret trong source/config theo Bước 7.

**Kết quả F2 (06/10/2026):** `/user/books` dùng `POST /api/books/search` và `GET /api/genres` cho tìm theo tên/tác giả/ISBN, lọc thể loại và tình trạng, sắp xếp, phân trang (9 sách/trang), trạng thái tải/rỗng/lỗi. `/user/books/{id}` dùng API đọc sách theo ID mới; sách không tồn tại hoặc inactive trả 404. Backend bổ sung bộ lọc `unavailableOnly` để “Đã hết sách” được lọc trước phân trang; không đổi schema hay dữ liệu. `/demo/books` giữ dữ liệu mẫu để xem không cần đăng nhập. Đã kiểm tra frontend test/lint/build, backend khởi động với MySQL `library_db1` và test catalog MySQL chỉ đọc; chưa nghiệm thu hiển thị `/user/books` bằng tài khoản USER thật. Mượn/đặt giữ/Wishlist/đánh giá trong chi tiết sách thuộc F3, chưa gắn nút thao tác giả.

**Kết quả F3A (06/10/2026):** `/user/wishlist` hiển thị các sách đã lưu, ghi chú (nếu có), ngày lưu, mở sách và bỏ lưu. Danh mục/chi tiết sách có nút yêu thích; chi tiết cho nhập ghi chú tùy chọn khi thêm. Trạng thái nút được tải từ toàn bộ các trang của `GET /api/wishlist/my-wishlist` và nạp lại sau `POST /api/wishlist/add/{bookId}` hoặc `DELETE /api/wishlist/remove/{bookId}`, không tự đánh dấu thành công khi backend lỗi. API client được bổ sung DELETE; không đổi backend hay schema. `/demo/wishlist` cho xem dữ liệu mẫu, không gọi API/ghi dữ liệu. Tài liệu mô tả cập nhật ghi chú nhưng backend hiện chưa có `PUT /api/wishlist/update-notes/{bookId}`; F3A chỉ cho xem ghi chú và nhập lúc thêm, chưa làm sửa ghi chú. Chưa nghiệm thu thao tác ghi thực tế bằng tài khoản USER trên database chính vì chưa có tài khoản kiểm thử được chỉ định.

**Kết quả F3B (06/10/2026):** `/user/my-loans` dùng toàn bộ trang của `GET /api/book-loans/my` để hiển thị lịch sử, lọc các trạng thái kể cả quá hạn theo ngày thực tế, xem chi tiết từng lượt, xác nhận trả qua `POST /api/book-loans/checkin` và gia hạn qua `POST /api/book-loans/renew` khi đủ điều kiện hiển thị. `/user/books/{id}` cho mượn qua `POST /api/book-loans/checkout`, lấy `maxDaysPerBook` từ `GET /api/subscriptions/user/active`, mặc định `min(14, hạn mức gói)`; backend vẫn là nguồn quyết định cuối cho tồn kho, hạn mức và quyền. Sau thao tác thành công, tải lại dữ liệu thật; lỗi không được coi là thành công. Dashboard USER lấy lượt mượn từ API và chưa hiển thị số đặt giữ mẫu; `/demo/...` chỉ dùng dữ liệu mẫu và không có thao tác ghi. Frontend test/lint/build đạt; chưa thử ghi thật trên MySQL chính vì chưa có tài khoản/dữ liệu kiểm thử được chỉ định. Backend, schema và dữ liệu không thay đổi trong F3B.

**Kết quả F3C (07/10/2026):** `/user/my-reservations` đọc toàn bộ trang `GET /api/reservations/my`, hiển thị trạng thái, vị trí hàng đợi, hạn nhận, ghi chú và lịch sử; hủy qua `DELETE /api/reservations/{id}` khi DTO cho phép; nhận sách qua `POST /api/reservations/{id}/fulfill` khi `AVAILABLE`, sách còn và chưa hết hạn. Trang chi tiết sách hết bản cho tạo qua `POST /api/reservations`, có ghi chú tùy chọn. Mọi thao tác ghi đều có xác nhận, hiển thị lỗi backend và tải lại dữ liệu sau thành công; backend kiểm tra trùng, giới hạn năm đặt giữ, quyền và điều kiện nhận. Dashboard USER lấy số/nhóm đặt giữ từ API; `/demo/...` vẫn chỉ có dữ liệu mẫu, không gọi API ghi. Tài liệu mô tả `GET /api/reservations/{id}` và API tra vị trí riêng nhưng backend hiện chưa expose; chi tiết và `queuePosition` dùng DTO trong danh sách. Chưa thử ghi thật trên MySQL chính vì chưa có dữ liệu/tài khoản thử được chỉ định. Không thay backend, schema hoặc dữ liệu trong F3C.

**Kết quả F3D (07/10/2026):** `/user/books/{id}` hiển thị các đánh giá đang hoạt động từ `GET /api/reviews/book/{bookId}` (tải đủ trang, phân trang giao diện); người dùng có lượt mượn sách ở trạng thái `RETURNED` được mở form tạo `POST /api/reviews`, và người đã đánh giá có thể sửa `PUT /api/reviews/{id}` hoặc xác nhận xóa mềm `DELETE /api/reviews/{id}`. Form kiểm tra điểm 1–5, nội dung 10–2000 ký tự, tiêu đề tối đa 200 ký tự; sau thao tác thành công tải lại danh sách, lỗi backend được hiển thị. Backend vẫn quyết định quyền và điều kiện cuối cùng. Backend không expose API `can-review` hay “đánh giá của tôi”; điều kiện tạo được suy từ lịch sử mượn và danh sách review. Sau khi xóa mềm, backend hiện vẫn chặn tạo lại đánh giá cùng sách (kiểm tra trùng kể cả bản ghi inactive); giao diện cảnh báo rõ, không tự đổi nghiệp vụ. Chưa thử ghi thật trên MySQL chính vì chưa có tài khoản/dữ liệu thử được chỉ định. Không thay backend, schema hoặc dữ liệu trong F3D.

**Kết quả F4A (07/10/2026):** `/user/subscriptions` đọc `GET /api/subscription-plans` và `GET /api/subscriptions/user/active`, chỉ giới thiệu gói active có giá VND hợp lệ, hiển thị hạn mức/ngày hiệu lực của gói đang dùng. `404` của active nghĩa là chưa có gói; lỗi khác khóa thao tác để không đoán trạng thái. Hủy gói qua `POST /api/subscriptions/cancel/{id}` có xác nhận và cảnh báo mất quyền ngay, không tự hoàn tiền; sau hủy được chọn gói mới. Nút “Chọn gói” hiện chỉ xem thông tin và báo rõ chưa tạo đơn/thu tiền: thao tác tạo QR/checkout thuộc F4C. Backend được bổ sung kiểm tra gói active lúc tạo draft/chuẩn bị order và lúc settlement, đồng bộ bằng khóa hàng user; settlement dùng truy vấn khóa để tránh snapshot MySQL cũ. Nếu hai đơn đã được trả, đơn đến sau không được tự cấp thêm gói mà cần đối soát thủ công. Endpoint active trả 404 rõ ràng khi không có gói. Frontend 28/28 test, lint và build đạt; backend 24/24 test liên quan đạt (H2 giả lập, không gọi payOS). Không thay schema hoặc bật payOS. Chưa thử thanh toán thật hay ghi trên MySQL chính.

**Kết quả F4B (08/10/2026):** `/user/my-fines` đọc `GET /api/fines/my`, hiển thị danh sách, lọc theo trạng thái/loại, chi tiết khoản mượn liên quan, lý do, tiền phạt/đã trả/còn nợ. Chỉ khoản `PENDING` hoặc `PARTIALLY_PAID` còn dư mới có nút mở thông tin thanh toán; khoản `PAID`/`WAIVED` không có thao tác trả. Dashboard USER lấy tổng nợ từ cùng API; bản `/demo` không gọi API tiền phạt hoặc hiện số giả. API FineDTO chưa có trạng thái đơn payOS đang xử lý, nên giao diện không suy diễn trạng thái đó từ khoản phạt. Nút thanh toán hiện chỉ báo luồng QR/payOS thuộc F4C, **chưa gọi POST tạo đơn, chưa tạo QR và chưa thu tiền**. Frontend 32/32 test, lint và build đạt; build còn cảnh báo dependency `use client` và bundle lớn. Chưa nghiệm thu hiển thị bằng tài khoản USER thật trên MySQL chính; không thay backend, schema hoặc dữ liệu.

**Kết quả F4C (08/10/2026):** Nút mua gói và trả phạt có bước xác nhận rồi dùng `POST /api/subscriptions/subscribe` hoặc `POST /api/fines/{id}/pay` khi được bật; response VND/payOS phải hợp lệ trước khi lưu QR/link trong `sessionStorage` theo payment ID. `/user/payments/{id}` hiển thị mã VietQR nội bộ, link checkout payOS, số tiền/trạng thái từ `GET /api/payments/{id}/status`; `/user/payments/result?orderCode=...` tra backend sau khi quay về. Query của payOS (`status=PAID` hoặc `cancel`) **không** tự làm giao diện báo thành công/hủy; chỉ trạng thái backend `SUCCESS` được coi là xác nhận. Trang chờ kiểm tra lại theo chu kỳ; nút `POST /api/payments/{id}/reconcile` là thao tác chủ động và chỉ khả dụng khi bật thanh toán. Phiên hết hạn rồi đăng nhập lại vẫn giữ query để tra đơn. Đơn cũ được backend trả về nhưng không có QR/link ở phiên trình duyệt mới sẽ hiển thị cảnh báo, không tự tạo đơn thay thế. Đã thêm `qrcode.react` để tạo SVG tại trình duyệt, không gửi payload QR sang dịch vụ ảnh bên ngoài.

**Cổng an toàn F4C:** `VITE_PAYMENTS_ENABLED` mặc định không phải `true`, nên UI không gọi API tạo đơn/đối soát. Backend cũng mặc định tắt `payos.enabled` và `payos.creation-enabled`. Chỉ cấu hình `VITE_PAYMENTS_ENABLED=true` cùng cấu hình backend/khóa **qua môi trường** sau khi có webhook HTTPS, URL `payos.return-url` và `payos.cancel-url` trỏ tới `/user/payments/result`, đối soát và kiểm thử tiền thật được duyệt riêng. `localhost` không đủ để nhận webhook công khai; không đưa khóa payOS vào Vite hoặc source. Chưa bật các cờ, chưa gọi payOS/ngân hàng, chưa tạo đơn/giao dịch thật và chưa nghiệm thu end-to-end trên MySQL chính trong F4C. Bộ test frontend dùng API giả lập; cần kiểm thử trên môi trường staging trước khi bật thanh toán thực. Frontend có 37/37 test, lint và build đạt; build vẫn cảnh báo dependency `use client` và bundle lớn. Backend không đổi; lượt thử lại test Maven giả lập trên máy hiện tại không có kết quả xác nhận do tiến trình treo, nên không tính là đã nghiệm thu backend ở F4C.

**Điểm phụ thuộc backend:** [Final Review Bước 7](../docs/STEP7_FINAL_REVIEW.md) còn ghi rủi ro tồn kho khi catalog cập nhật đồng thời, nhiều gói active và secret trong source/config. Các mục này cần được xử lý trước các mốc tương ứng F5/F4C/triển khai Internet. Không tự thay schema hoặc bật thanh toán thật theo kế hoạch frontend.

## Nhật ký backend (lịch sử các đợt triển khai)

Các mốc và số liệu bên dưới được giữ để truy vết tại thời điểm ghi. Để xem trạng thái review cuối hiện có, dùng [báo cáo Bước 7](../docs/STEP7_FINAL_REVIEW.md); phần lịch sử không thay thế kết quả kiểm thử mới.

**05/10/2026, 21:12:** 6A đã xử lý lỗi search mặc định, ẩn hash trong profile và phân quyền danh sách user theo lựa chọn ADMIN-only; **21/21 API MySQL 6A** đạt. 6F cũng đã hoàn tất **12/12 API MySQL**. `mvn clean package` sau 6A: **72/72 regression đạt**. MySQL read-only sau kiểm tra: 12 bảng đều 0 dòng.

**6C đã sửa các lỗi xác nhận trong bộ kiểm chứng**, xem [kết quả sửa 6C](../docs/STEP6C_FIX_RESULT.md). C-08 và kiểm tra MySQL concurrency/HTTP thực 6G–6H còn mở. Package 80/80 lúc 19:40:46 là trước thay đổi policy; chưa package lại sau lượt cuối, clean đã xóa JAR cũ. Không khẳng định full suite xanh. Các số liệu/hash JAR dưới đây là lịch sử.

Cập nhật ngày **05/10/2026 — 6A, 6B, 6C, 6D, 6E, 6F đã được triển khai theo phạm vi nêu trong báo cáo riêng; 6G/6H còn mở (Asia/Saigon)**.

| Giai đoạn | Tình trạng |
|---|---|
| A — Review payOS | Đã hoàn thành |
| B1 — SDK/cấu hình | Đã triển khai; mặc định tắt payOS |
| B2 — VND/tạo đơn membership | Đã triển khai và kiểm thử |
| C1 — Webhook/đối soát/kích hoạt membership | Đã triển khai và kiểm thử offline/H2 |
| C2 — Fine/tháo Razorpay | Đã triển khai; 59 test offline/H2 đạt ở lần nghiệm thu C2 |
| **B0 nhóm 1 — Schema subscription_plans** | **Đã áp dụng trên MySQL và kiểm chứng thành công** |
| **B0 nhóm 2 — Review/reset-token** | **Đã tạo hai bảng, sửa mapping và kiểm chứng thành công** |
| **B0 nhóm 3 — Payment CHECK/default** | **Đã áp dụng PROCESSING và default VND; startup validate thành công** |
| **Bước 4 — Build/test/package** | **Đã hoàn thành: 18 lớp, 68 test qua; tạo executable JAR** |
| **Bước 5 — Runtime JAR** | **Đã startup JAR thành công trên MySQL validate/read-only; 9 HTTP smoke checks đạt; đã dừng server** |
| **Bước 6 — API + MySQL** | **Chưa hoàn tất; tiến độ hiện tại theo bảng 6A–6H bên dưới. Số liệu các đợt trước được giữ ở phần lịch sử** |
| **6B — Mượn/trả/gia hạn** | **Đã sửa: 33/33 API MySQL và 6/6 atomicity H2 đạt; concurrency MySQL/HTTP commit còn chờ 6G/6H** |
| **6C — Reservation** | **Đã sửa lỗi xác nhận; 19/19 API + 3/3 H2 đạt** |
| Startup toàn ứng dụng | Đã thành công với MySQL validate/read-only, payOS và initializer tắt; đã dừng tiến trình thử |
| Thanh toán thật / Frontend | Chưa kiểm thử giao dịch thật; chưa làm Frontend |

**Chưa bật nhận tiền thật.** Ba nhóm schema B0 đã được áp dụng; startup thành công không thay thế kiểm thử API ghi dữ liệu, webhook HTTPS và giao dịch thật được duyệt.

## Bước 6 — Đợt 1 (05/10/2026)

### Trình tự 6A–6H và trạng thái mới nhất

Sổ đối chiếu yêu cầu, code, test và phần chưa nghiệm thu: [Bảng tài liệu–code–test Bước 6](../docs/STEP6_TRACEABILITY.md). Bảng phân biệt kết quả đã chạy, test chỉ mới viết, khác biệt hợp đồng và chức năng tài liệu chưa được expose; không coi build xanh là mọi API đạt.

| Mã | Nội dung | Trạng thái |
|---|---|---|
| 6A | Auth/catalog/wishlist/quản lý gói/thống kê | Search `{}` và profile password đã sửa; user list chỉ ADMIN theo lựa chọn; 21 API MySQL + 72 regression/package đạt. Contract chưa quyết định còn mở |
| 6B | Mượn/trả/gia hạn | Lỗi xác nhận đã sửa; 33 API MySQL + 6 atomicity H2 đạt |
| 6C | Reservation | Đã sửa lỗi xác nhận: 19/19 API và 3/3 H2 đạt; policy ngày mượn đã duyệt/kiểm chứng |
| 6D | Review | Đã triển khai soft delete; 6/6 API review và 80/80 regression/package đạt |
| 6E | Reset mật khẩu/token | Đã sửa; 8 API MySQL và 80 regression/package đạt; SMTP thật/concurrency còn mở |
| 6F | Membership/fine/payment | 12 API MySQL + 72 regression/package đạt; payOS/giao dịch thật chưa kiểm tra |
| 6G | Ràng buộc/transaction/concurrency MySQL | Chưa đầy đủ; loan atomicity đã kiểm tra trên H2 riêng |
| 6H | HTTP thật và nghiệm thu tổng thể | Chưa làm |

**6B:** quyền owner/admin, đúng membership target, hạn ngày checkout, trạng thái trả, kiểm tra quá hạn theo ngày, lưu overdue_days, response lỗi, defaults/null. Transaction và row locks bảo vệ quota/tồn kho; không ALTER schema hoặc thêm tính tiền phạt. Xem [báo cáo sửa 6B](../docs/STEP6B_FIX_RESULT.md).

**6C:** đã sửa quyền/target user, state/expiry, hàng đợi, phản hồi lỗi, transaction và ngày checkout theo gói. Xem [kết quả sửa 6C](../docs/STEP6C_FIX_RESULT.md); [báo cáo kiểm tra trước sửa](../docs/STEP6C_RESERVATION_REVIEW.md) giữ lịch sử.

**6D:** review hiện hỗ trợ soft delete qua `book_reviews.is_active`; sáu API review đạt, regression/package đạt 80/80 và executable JAR đã tạo. Xem [kết quả 6D](../docs/STEP6D_RESULT.md). Các route helpful/statistics/filter chưa expose và chưa triển khai.

**6E:** forgot/reset password đã sửa; 8 ca API MySQL và 80 ca regression/package đạt. Email được mock, schema không đổi; SMTP delivery và MySQL committed concurrency còn mở. Xem [kết quả 6E](../docs/STEP6E_RESULT.md).

**6A:** xem [báo cáo 6A](../docs/STEP6A_RESULT.md); giữ nguyên các contract chưa được quyết định như xóa Plan hard/soft và semantics của `activeOnly=false`.

**6F:** xem [báo cáo 6F](../docs/STEP6F_RESULT.md); payment gateway giữ tắt, chưa xác minh thanh toán thật.

Compile sạch thành công. Lần cuối 6B: **39/39 đạt** (33 MySQL + 6 H2), 14:44:51. Regression/package riêng: **77/77 đạt**, 14:48:21; loại bộ Step6ApiMySqlIT khỏi lượt package nên không phải full suite xanh. 6C: **5/16 đạt**, còn lỗi. Các tỷ lệ này là các bộ chọn khác nhau, không cộng thành tỷ lệ đạt toàn project.

JAR SHA-256 hiện tại: `99a6995cae5f56dbf719c6bd4a21c5367efa6090ee75e494ac7fd52e9f731239`; hash bên dưới là lịch sử. Chưa chạy standalone JAR mới, context đã kiểm tra trong test. JDBC readonly sau test: 12 bảng vẫn 0 dòng; fixture rollback, không reset ID, không email/payOS thật. Giữ artifact nội bộ do cấu hình nhạy cảm hiện hữu.

### Kiểm tra riêng Mượn/trả/gia hạn — lịch sử trước sửa

Đã chạy chọn lọc 25 ca loan, không chạy test các module khác. 4 ca đạt: luồng mượn/gia hạn/trả bình thường và truy vấn, trả LOST không tăng tồn kho, /my cách ly người dùng, validation cơ bản. Có 10 assertion failures và 11 request errors; nhiều lỗi response có chung nguyên nhân thiếu handler, không phải 21 lỗi nghiệp vụ độc lập.

Xác nhận vấn đề quyền sở hữu/admin, dùng sai membership của target, bỏ qua maxDaysPerBook, quá hạn phụ thuộc job, overdue_days không lưu và nhận condition trả sách sai. Chi tiết 25 ca, bảng ưu tiên, rủi ro transaction và các phần chưa kiểm tra: [Báo cáo loan](../docs/STEP6_LOANS_REVIEW.md).

Chỉ bổ sung test và tài liệu, chưa sửa Backend/schema. MySQL độc lập sau test: 12 bảng 0 dòng; fixture rollback, không reset ID, không email/payOS thật. Không chạy commit/concurrency trên database chính. Test compile thành công; Maven BUILD FAILURE do các ca kiểm tra chưa đạt. Các con số nhóm 1/2 bên dưới là lịch sử bộ test chọn lọc khác, không phải tỷ lệ đạt của toàn Backend hiện tại.

### Cập nhật sau sửa nhóm 2

- Cập nhật gói trả `planMapper.toDTO(updatedPlan)` thay vì null; giữ nguyên mapper, giá VND và nghiệp vụ cập nhật.
- GET `/api/genres/{id}/book-count` dùng query đếm sách có `genre_id` trực tiếp trỏ tới thể loại. Theo tài liệu “số sách đang dùng thể loại”: gồm sách xóa mềm, không cộng số bản sao hoặc sách của thể loại con. Không sửa trường `GenreDTO.bookCount` hoặc thêm endpoint.
- Chỉ sửa 3 file nghiệp vụ: `SubscriptionPlanServiceImpl.java`, `GenreServiceImpl.java`, `BookRepository.java`. Thêm `Group2ServiceTests.java` và mở rộng `Step6ApiMySqlIT.java`.
- Test-first: 3 ca nhóm 2 đều fail trước sửa; sau sửa đều đạt. Bộ API đầy đủ hiện có **17 test: 16 pass, 1 error**, chỉ còn lỗi search `{}` gây page null. Ba unit test nhóm 2 đều đạt. Lệnh clean compile/test vẫn trả BUILD FAILURE vì giữ nguyên test search lỗi, không vì compile.
- Compile sạch 136 source + 20 test source thành công. Package với bộ hồi quy/unit, loại riêng Step6ApiMySqlIT: **71/71 đạt, BUILD SUCCESS** lúc 07:36:50 ngày 05/10/2026. Không phải toàn suite xanh, không thay cho kiểm thử các API còn thiếu.
- JAR mới SHA-256: `1b240588a915a96fca3f00652d7bf2ef365241fd4e0453e4f101efb8da1abaca`. Hash các giai đoạn trước là lịch sử. Chưa chạy standalone JAR mới; Spring context và query JPA đã chạy trong test.
- Diagnostic JDBC read-only sau test: 12 bảng vẫn 0 dòng. Không đổi schema, không để lại fixture, không reset AUTO_INCREMENT, không email/payOS thật. Không sửa lỗi search ngoài nhóm.

Xem [báo cáo nhóm 2](../docs/STEP6_GROUP2_RESULT.md). Nhóm 1 bên dưới là kết quả lịch sử; Bước 6 vẫn còn kiểm tra mượn/trả/reservation/review/fine/payment và lỗi search đã biết.

### Cập nhật sau sửa nhóm 1

- Quyền ADMIN cho POST tạo thể loại/bulk sách và PUT/DELETE sách/thể loại; POST tìm kiếm sách và GET vẫn dành cho người dùng đã đăng nhập. Endpoint tạo sách admin giữ nguyên.
- Signup sửa kiểm tra email tồn tại, giữ role cố định ROLE_USER bất kể role trong request, trả JWT có quyền ROLE_USER và không giữ mật khẩu trong Authentication.
- Bật validation email/mật khẩu/họ tên và độ dài tương ứng schema; UserException chuyển từ Throwable sang Exception, handler trả 400/ApiResponse cho lỗi loại này. Loại password khỏi DTO.toString(). Không thay schema, không tự đổi policy mật khẩu hoặc kích hoạt email/payOS.
- Test-first trước sửa: 15 test có 4 failures + 5 errors. Sau sửa/bổ sung ca riêng cho search defaults: **16 test, 13 pass, 2 failures, 1 error**. Tất cả ca nhóm 1 đạt, bao gồm 9 route ghi catalog kiểm tra cả USER/anonymous, admin CRUD/bulk và tìm kiếm bằng payload đầy đủ.
- `clean compile` compile 136 source thành công; test compile 19 lớp thành công. Bộ API vẫn BUILD FAILURE đúng 3 lỗi chưa sửa: DTO update plan, count genre, POST search `{}` làm page null. Không xóa hoặc bỏ qua test này để báo toàn bộ đạt.
- Chạy riêng bộ hồi quy trước Bước 6 (`-Dtest=*Tests,*IT,!Step6ApiMySqlIT`): **68/68 đạt, package BUILD SUCCESS** lúc 07:30:52 ngày 05/10/2026. MySQL readonly, payOS/initializer tắt trong lần regression. Đây không phải full suite xanh.
- JAR mới SHA-256 `67cd96e834af5a7bb646510cfe48cb7fe61128f02de90d8fea10603c225d0ca5`; hash/log Bước 4/5 bên dưới là lịch sử. Lệnh clean đã xóa artifacts/log cũ trong target. Chưa chạy lại standalone JAR sau nhóm 1; Spring context đã được kiểm tra trong test.
- Diagnostic độc lập sau test xác nhận đúng library_db1, MySQL 9.2.0, 12 bảng đều 0 dòng. Không reset AUTO_INCREMENT. Không gửi email/giao dịch thật, không thay dữ liệu hiện có.

Chi tiết phạm vi/file/lệnh: [Kết quả sửa nhóm 1](../docs/STEP6_GROUP1_RESULT.md). Các dòng đợt 1 bên dưới là lịch sử trước sửa.

Đã thêm test opt-in `src/test/java/com/library/Step6ApiMySqlIT.java`, chạy MVC/security/service/repository thật với MySQL; mỗi test rollback. Không gọi payOS hoặc email. Chỉ test khi đúng library_db1 và toàn bộ bảng rỗng; không bỏ guard khi có dữ liệu.

- Đạt: login/phân quyền endpoint admin đã cấu hình, genre CRUD, book CRUD/FK hợp lệ, validation tạo book, wishlist, plan create/read/delete.
- Chưa đạt: signup email mới, chặn member xóa book vĩnh viễn, book count theo genre, DTO response update plan. Tổng **10 tests: 6 pass / 3 failures / 1 error**; Maven BUILD FAILURE do test phát hiện lỗi, source test compile thành công.
- Diagnostic độc lập sau test xác nhận 12 bảng đều 0 dòng; AUTO_INCREMENT có thể tăng dù rollback. Không reset ID, không thay schema hoặc code nghiệp vụ.
- MockMvc không phải HTTP qua socket; transaction test không chứng minh commit/rollback production. Chưa kiểm tra toàn bộ mượn/trả/reservation/review/fine/payment hoặc FK khi ghi sai.

Chi tiết, bảng lỗi và đề xuất nhóm sửa: [Báo cáo Bước 6](../docs/STEP6_API_MYSQL_RESULT.md). **Chờ duyệt sửa; chưa chuyển Bước 7.**

## Bước 5 — Runtime JAR

### Kiểm chứng lại ngày 05/10/2026

- Chạy lại cùng executable JAR; SHA-256 vẫn là `4dfa818e1e39101a5c57043b84a0021696726beeb782af5c99b2e5a2364f29a4`.
- 07:03:00: Hikari kết nối `library_db1`, MySQL 9.2; 07:03:02: JPA EntityManagerFactory initialized với `ddl-auto=validate`.
- 07:03:07: Spring Boot startup thành công trong 27.335 giây; PID 3212, loopback port 60693; scan 12 repository interfaces, AuthenticationManager khởi tạo thành công.
- Chạy lại đúng 9 HTTP/security smoke checks trong bảng bên dưới: 9/9 đạt, bao gồm CORS allowed-origin đúng localhost:5173. Webhook trả 503 do chủ động tắt payOS, không phải startup lỗi.
- Giữ SQL init/admin initializer/payOS tắt, Hikari read-only và session `transaction_read_only=ON`; không gọi API nghiệp vụ ghi dữ liệu, không gửi email hoặc thanh toán.
- Sau Ctrl+C, terminal kết thúc và `Get-Process -Id 3212` không còn tiến trình. Log phiên này không ghi dòng graceful shutdown nên không khẳng định graceful shutdown cho lần chạy lại.
- Diagnostic JDBC chỉ đọc sau phiên thử: đúng `library_db1`, MySQL 9.2.0, read_only=1, cả 12 bảng đều 0 bản ghi. Không sửa schema/source/cấu hình; chỉ cập nhật README và tạo log `target/runtime-step5-recheck.log`.
- Vẫn có cảnh báo open-in-view; phạm vi còn chờ là Bước 6 (API nghiệp vụ và ghi/update/delete/FK), không được suy ra từ startup thành công.

### Lần nghiệm thu trước — 04/10/2026

Đã chạy trực tiếp `target/Library-0.0.1-SNAPSHOT.jar` bằng `java -jar`, không dùng Maven spring-boot:run hoặc target/classes. SHA-256 trước/sau giữ nguyên artifact Bước 4: `4dfa818e1e39101a5c57043b84a0021696726beeb782af5c99b2e5a2364f29a4`.

### Kết quả ngày 04/10/2026

- 19:56:44: Hikari kết nối thành công `library_db1`, MySQL 9.2, MySQL Connector/J.
- 19:56:47: Hibernate khởi tạo JPA EntityManagerFactory thành công với `ddl-auto=validate`, không báo lỗi table/column mapping trong startup.
- Scan 12 repository interfaces; Spring context/bean creation hoàn tất, AuthenticationManager dùng customUserServiceImplementation.
- 19:56:53: `Started LibraryApplication in 17.067 seconds`, Tomcat mở port ngẫu nhiên 60378. Cấu hình bind 127.0.0.1 chỉ cho phiên thử, không đổi port cấu hình project.
- 19:57:35–36: chủ động Ctrl+C, graceful shutdown Tomcat, đóng JPA/Hikari. Xác nhận PID 22716 không còn chạy. Exit code của terminal sau Ctrl+C không được dùng làm kết luận startup lỗi.
- Không có dòng ERROR trong log phiên này; còn warning `spring.jpa.open-in-view` mặc định. Không thay kiến trúc để xử lý warning trong bước runtime.

Theo verification-before-completion, kết luận dựa trên log của JAR thực tế và phản hồi HTTP mới, không dựa riêng vào build trước đó.

### HTTP/security smoke checks — 9/9 đạt

| Trường hợp | Kết quả |
|---|---|
| GET `/` | 200, `Hi!` |
| GET `/api/payments`, chưa đăng nhập | 403 |
| GET `/api/payments/1/status`, chưa đăng nhập | 403 |
| GET `/api/payments/1/status`, Bearer token sai | 401 |
| POST `/api/subscriptions/activate`, chưa đăng nhập | 403 |
| GET `/api/payments/webhook/payos`, chưa đăng nhập | 403 — chỉ POST webhook được public |
| POST `/api/payments/webhook/payos`, JSON `{}`, payOS disabled | 503 như dự kiến — không xác nhận thanh toán, không gọi provider |
| OPTIONS `/api/payments`, origin localhost:5173 | 200, Access-Control-Allow-Origin đúng `http://localhost:5173` |
| OPTIONS `/api/payments`, origin không được phép | 403 |

Kiểm tra socket qua Get-NetTCPConnection bị Windows từ chối quyền; chưa xác minh địa chỉ bind bằng công cụ OS. Cấu hình bind và HTTP qua 127.0.0.1 đã được ghi nhận. Không cần mở quyền hệ thống để vượt qua giới hạn chẩn đoán này.

### Cấu hình và dữ liệu

Lệnh chạy từ Library (dùng java.exe của JDK 23.0.1 trên máy):

```powershell
java -jar target/Library-0.0.1-SNAPSHOT.jar --spring.output.ansi.enabled=never --spring.jpa.hibernate.ddl-auto=validate --spring.sql.init.mode=never --app.initialize-admin=false --payos.enabled=false --payos.creation-enabled=false --spring.datasource.hikari.read-only=true --spring.datasource.hikari.connection-timeout=10000 --spring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=ON --server.address=127.0.0.1 --server.port=0 --spring.jpa.show-sql=false --logging.file.name=target/runtime-step5.log
```

Không sửa source, schema, cấu hình lưu trên đĩa hoặc JAR. Không tạo tài khoản, không gửi email, không tạo link thanh toán, không mở tunnel. Kiểm tra read-only sau phiên thử xác nhận 12 bảng đều 0 bản ghi. Chỉ cập nhật README và tạo log `target/runtime-step5.log` (bị xóa khi clean; giữ nội bộ).

**Giới hạn:** đã đạt phạm vi startup/datasource/Hibernate/bean creation và smoke security với gateway tắt. Chưa kiểm thử user/admin có JWT hợp lệ, nghiệp vụ CRUD MySQL, FK khi ghi, chức năng review/reset qua API, callback chữ ký thật hoặc giao dịch ngân hàng. Không coi Hibernate validate là kiểm chứng mọi ràng buộc nghiệp vụ/enum ở đường ghi. Những phần này thuộc Bước 6 và kiểm thử end-to-end sau khi duyệt dữ liệu thử.

## Bước 4 — Build/test/package

Kết quả mới ngày 04/10/2026:

- `clean compile`: BUILD SUCCESS lúc 19:50:36, compile 136 file Java.
- `clean package`: BUILD SUCCESS lúc 19:52:01, **68 tests, 0 failures, 0 errors, 0 skipped**; đối chiếu 18 báo cáo XML Surefire với 18 lớp test hiện có.
- Chạy cả `*Tests` và `*IT`, bao gồm `LibraryApplicationTests.contextLoads` (trước đó bộ chọn lọc B0 chưa chạy test này). Spring context/JPA kết nối MySQL và validate thành công trong môi trường test; MySQL tests chỉ đọc, kiểm thử transaction ghi dùng H2 in-memory.
- Spring Boot repackage thành công; kiểm tra manifest: Main-Class `org.springframework.boot.loader.launch.JarLauncher`, Start-Class `com.library.LibraryApplication`, Java-Version 17, Build-Jdk-Spec 23.
- JAR có payos-java-2.0.1 và mysql-connector-j-9.7.0; không chứa runtime H2, Razorpay hoặc DevTools.
- Không sửa source/pom/cấu hình runtime hoặc schema trong Bước 4; chỉ cập nhật README và tạo build artifacts trong target. Áp dụng verification-before-completion với kết quả build mới và kiểm tra artifact thực tế.

### Artifact

`target/Library-0.0.1-SNAPSHOT.jar` — 65,625,765 bytes; SHA-256:

```text
4dfa818e1e39101a5c57043b84a0021696726beeb782af5c99b2e5a2364f29a4
```

File `.jar.original` là JAR trước repackage, không phải artifact executable chính. `target/` là output tạm và bị xóa khi clean; hash trên chỉ áp dụng lần build này.

**Chỉ lưu artifact nội bộ:** application.properties hiện được đóng gói cùng ứng dụng và có cấu hình nhạy cảm hiện hữu. Không upload/chia sẻ JAR công khai; cần tách secrets sang môi trường trước phát hành. Không in hoặc sao chép giá trị bí mật vào báo cáo này.

### Lệnh đã thực hiện

Máy hiện tại dùng Maven 3.9.16 cached, JAVA_HOME trỏ JDK 23.0.1, compile release17. Lệnh tương đương khi `mvn` đã có trong PATH, chạy tại Library:

```powershell
mvn -o '-Dmaven.repo.local=C:\Users\APC\.m2\repository' clean compile
mvn -o '-Dmaven.repo.local=C:\Users\APC\.m2\repository' clean package '-Dtest=*Tests,*IT' '-Dspring.jpa.hibernate.ddl-auto=validate' '-Dspring.sql.init.mode=never' '-Dapp.initialize-admin=false' '-Dpayos.enabled=false' '-Dpayos.creation-enabled=false' '-Dspring.datasource.hikari.read-only=true' '-Dspring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=ON' '-Dspring.jpa.show-sql=false'
```

Các override chỉ dành cho lần kiểm thử, không sửa application.properties. Test cấu hình payOS dùng khóa giả và override cục bộ để kiểm tra bean, không gọi provider; test initializer chỉ kiểm tra bean, không chạy tạo admin.

Còn cảnh báo Lombok default trong GenreDTO/ReservationSearchRequest, Mockito dynamic agent/JDK, Hibernate pool test và open-in-view. Chưa refactor để dọn warning trong bước build.

**Giới hạn:** toàn bộ test hiện có đã qua nhưng chưa có nghĩa mọi nghiệp vụ được phủ test. Không chạy JAR đóng gói thành server riêng trong bước này; không kiểm thử CRUD MySQL, email, webhook public hoặc thanh toán thật. Những phần đó thuộc runtime/API/end-to-end tiếp theo và cần duyệt phạm vi dữ liệu thử. PayOS vẫn mặc định tắt; không để tiến trình test chạy nền.

## B0 nhóm 3 — Payment CHECK/default

Chỉ ALTER `library_db1.payments` một lần ngày 04/10/2026. Preflight dưới khóa ghi bảng xác nhận 0 bản ghi, default INR và CHECK đang enforced với đúng bốn trạng thái cũ. Sao lưu schema trước thay đổi, kiểm tra nội dung và SHA-256 rồi mới ALTER:

```sql
ALTER TABLE library_db1.payments
    ALTER COLUMN currency SET DEFAULT 'VND',
    DROP CHECK chk_payments_status,
    ADD CONSTRAINT chk_payments_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'));
```

Đối chiếu SHOW CREATE TABLE trước/sau: chỉ default currency và nội dung CHECK thay đổi; giữ nguyên cột, FK, index và các CHECK khác. Bảng vẫn 0 bản ghi. Không UPDATE tiền tệ/số tiền của dữ liệu cũ; không thêm REFUNDED, refund hoặc payout. Không sửa source runtime hay application.properties trong nhóm này.

### File và backup nhóm 3

- [Runner giới hạn nhóm 3, từ chối chạy lại](../database/B0Group3Migration.java).
- [Backup payments trước ALTER](../database/backups/b0_group3_20261004_194149_935/payments.before.sql).
- [SQL thực thi](../database/backups/b0_group3_20261004_194149_935/applied.sql).
- [DDL sau ALTER](../database/backups/b0_group3_20261004_194149_935/payments.after.sql).
- [Checksum backup](../database/backups/b0_group3_20261004_194149_935/backup.sha256): `d87e74b2f38c86bc15d5fc0e294fd7b41ccc869cb3e64b20fd5009eab9582a81`, đối chiếu lại bằng Get-FileHash.
- Test mới: `src/test/java/com/library/PaymentSchemaContractIT.java` đọc metadata MySQL để xác nhận default VND, VARCHAR(3) NOT NULL, CHECK enforced và đủ đúng năm trạng thái.

Backup schema-only là đầy đủ cho bảng mục tiêu rỗng lúc khóa, không phải backup toàn DB. Không chạy lại migration hoặc proposal stage4; không tự chạy bản backup để rollback. MySQL DDL implicit commit; chỉ lập phương án phục hồi sau khi kiểm tra dữ liệu thực tế.

### Kiểm chứng nhóm 3

Áp dụng verification-before-completion và systematic-debugging. Lần regression đầu có 1 test metadata mới lỗi do MySQL information_schema escape dấu nháy trong CHECK_CLAUSE; DDL và startup đã đúng. Đã sửa parser test để xử lý escape, không sửa thêm database, rồi chạy lại bộ kiểm chứng.

Lệnh tại Library (máy hiện tại dùng Maven cached 3.9.16, JDK23 release17):

```powershell
mvn -o '-Dmaven.repo.local=C:\Users\APC\.m2\repository' clean compile '-Dtest=PaymentSchemaContractIT,ReviewTokenMappingIT,CatalogMappingIT,SubscriptionPaymentMappingIT,FinePayOSRoutingTests,FinePaymentTests,PayOSAtomicityTests,PayOSConfirmationTests,PayOSHttpSecurityTests,PayOSSettlementTests,MembershipVndTests,SubscriptionPayOSRoutingTests,PayOSMembershipTests,PayOSRepositoryQueryTests,PayOSConfigurationTests,PayOSServiceTests,StartupConfigurationTests' test
```

Kết quả cuối lúc 19:45:56: **BUILD SUCCESS — 67 tests, 0 failures, 0 errors, 0 skipped; compile 136 source files**. Nhóm chọn gồm metadata/mapping MySQL read-only, unit test và transaction H2; không phải full suite và không kiểm thử ghi vào MySQL thật. Còn cảnh báo Lombok cũ, Mockito/JDK agent và Hibernate pool test; startup còn cảnh báo open-in-view. `git diff --check` qua.

Startup sau ALTER lúc 19:43:42: MySQL/Hikari kết nối, Hibernate EntityManagerFactory initialized, Spring Boot `Started LibraryApplication`. Cấu hình kiểm tra như nhóm 2: validate, SQL init/initializer/payOS tắt, Hikari read-only, session transaction_read_only=ON, loopback port ngẫu nhiên. Port phiên này 54797: GET `/` trả 200/Hi!, GET `/api/payments` không JWT trả 403. Đã graceful shutdown lúc 19:44:39, đóng JPA/Hikari; PID thử không còn chạy. Không thay cấu hình port cố định của project.

Các phần nhóm 1/2 bên dưới là lịch sử nghiệm thu; các dòng nói nhóm 3 còn chờ chỉ mô tả trạng thái tại thời điểm đó.

## B0 nhóm 2 — Kết quả

- Đã kiểm tra trực tiếp trước migration: 10 bảng cũ, tất cả rỗng, hai bảng mục tiêu chưa tồn tại.
- Đã sao lưu schema của 10 bảng trước thay đổi, kiểm tra lại nội dung và SHA-256. Đây là schema-only snapshot, không phải cơ chế backup dữ liệu cho database có bản ghi.
- Chỉ tạo `book_reviews` và `password_reset_tokens`; không ALTER bảng cũ, không chèn/xóa dữ liệu. Sau kiểm tra: 12 bảng, tất cả vẫn 0 bản ghi.
- `BookReview.java`: map `book_reviews`, IDENTITY, FK user_id/book_id bắt buộc, UNIQUE user/book, review_text VARCHAR(2000), title VARCHAR(200), timestamp rõ tên.
- `PasswordResetToken.java`: map `password_reset_tokens`, IDENTITY, token UNIQUE VARCHAR(255), FK user_id bắt buộc, expiry_date rõ tên.
- Bảng review có CHECK rating 1–5, độ dài nội dung 10–2000 theo request hiện có. Không cascade delete, không thêm nghiệp vụ.
- Không tạo `book_review_seq` hoặc `password_reset_token_seq`. Không sửa service/controller hoặc cấu hình payOS.

### File và backup nhóm 2

- Source sửa: `src/main/java/com/library/modal/BookReview.java`, `PasswordResetToken.java`.
- Test mới: `src/test/java/com/library/ReviewTokenMappingIT.java` — validate/SELECT MySQL, không ghi dữ liệu.
- [SQL chỉ nhóm 2](../database/b0_group2.sql), [runner có preflight](../database/B0Group2Migration.java).
- [Backup schema trước thay đổi](../database/backups/b0_group2_20261004_192657_407/schema.before.sql).
- [SQL đã áp dụng](../database/backups/b0_group2_20261004_192657_407/applied.sql).
- DDL thực tế sau tạo: [book_reviews](../database/backups/b0_group2_20261004_192657_407/book_reviews.after.sql), [password_reset_tokens](../database/backups/b0_group2_20261004_192657_407/password_reset_tokens.after.sql).
- SHA-256 backup, đã kiểm tra bằng Get-FileHash: `de248838bb577611bd0d20882907efe92649062ffa4520820f427adb741af777`.

Không chạy lại CREATE hoặc toàn SQL stage4. Runner từ chối nếu schema không còn trạng thái trước migration. DDL implicit commit; nếu lỗi giữa hai CREATE phải kiểm tra trạng thái thực tế, không tự DROP/retry toàn bộ. Backup ở ngoài Git root Library: cần giữ cùng workspace khi bàn giao.

### Kiểm thử và startup nhóm 2

Áp dụng test-driven-development: test mới trước sửa thất bại đúng lỗi `missing table [book_review_seq]`; sau sửa và migration đã qua. Theo verification-before-completion, kết quả dưới đây lấy từ lần chạy mới sau thay đổi.

```powershell
mvn -o '-Dmaven.repo.local=C:\Users\APC\.m2\repository' clean compile '-Dtest=ReviewTokenMappingIT,CatalogMappingIT,SubscriptionPaymentMappingIT,MembershipVndTests,PayOSMembershipTests,SubscriptionPayOSRoutingTests' test
```

**BUILD SUCCESS: 23 tests, 0 failures, 0 errors, 0 skipped**, compile 136 source files, kết thúc 19:27:54. Dùng Maven cached 3.9.16, JDK23 release17; không chạy full suite. Còn cảnh báo Lombok/Mockito cũ.

Startup thực tế 19:28:33: Hikari kết nối MySQL 9.2, Hibernate/JPA EntityManagerFactory khởi tạo thành công, 12 repository được scan, Spring Boot báo `Started LibraryApplication`. Chạy với các override chỉ dành cho phiên kiểm tra:

```text
JVM: -Dspring.devtools.restart.enabled=false
--spring.jpa.hibernate.ddl-auto=validate
--spring.sql.init.mode=never
--app.initialize-admin=false
--payos.enabled=false
--payos.creation-enabled=false
--spring.datasource.hikari.read-only=true
--spring.datasource.hikari.connection-timeout=10000
--spring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=ON
--server.address=127.0.0.1
--server.port=0
--spring.jpa.show-sql=false
```

Port được cấp cho phiên kiểm tra là 56719: GET `/` trả **200 / Hi!**; GET `/api/payments` không đăng nhập trả **403**. Đây chỉ là HTTP/security smoke test, không chứng minh toàn bộ phân quyền hoặc API nghiệp vụ. Không gửi email reset, không thanh toán, không thử ghi/update/delete MySQL. Cảnh báo open-in-view vẫn có, không đổi kiến trúc trong nhóm này.

Đã dừng bằng Ctrl+C lúc 19:37; log xác nhận graceful shutdown Tomcat, đóng JPA và Hikari. Terminal kết thúc sau xác nhận dừng batch; không để server test chạy nền. Chưa thử startup với payOS enabled hoặc cấu hình ghi production.

## B0 nhóm 1 — Đã làm gì?

Đối tượng duy nhất được ALTER: `library_db1.subscription_plans`, MySQL 9.2.0.

1. Kiểm tra trực tiếp bảng: 13 cột ban đầu, 0 bản ghi.
2. Giữ khóa ghi bảng trong lúc kiểm tra bảng rỗng, sao lưu và ALTER để tránh có dữ liệu chèn vào giữa các bước.
3. Sao lưu schema trước thay đổi, đọc kiểm tra lại file và tính SHA-256. Vì bảng rỗng tại thời điểm khóa, bản schema-only bao phủ toàn bộ trạng thái của bảng mục tiêu; đây không phải backup toàn database.
4. Thêm đúng 10 cột và UNIQUE cho `plan_code`.
5. Đọc SHOW CREATE TABLE sau ALTER; số bản ghi vẫn là 0; mở khóa và đóng kết nối.
6. Build sạch, validate/read-only SELECT trên MySQL và chạy regression membership: 22 test đạt.

| Cột mới | Kiểu / ràng buộc |
|---|---|
| plan_code | VARCHAR(100), NOT NULL, UNIQUE |
| currency | VARCHAR(3), NOT NULL, DEFAULT 'VND' |
| max_books_allowed | INT, NOT NULL |
| max_days_per_book | INT, NOT NULL |
| display_order | INT, NOT NULL, DEFAULT 0 |
| is_featured | BOOLEAN, NOT NULL, DEFAULT FALSE; MySQL hiển thị TINYINT(1) |
| badge_text | VARCHAR(255), NULL |
| admin_notes | VARCHAR(255), NULL |
| created_by | VARCHAR(150), NULL |
| updated_by | VARCHAR(150), NULL |

Giữ nguyên 13 cột cũ, PK, UNIQUE title và các CHECK hiện có, bao gồm price DECIMAL(10,2). Không tự thêm CHECK hạn mức mới trong nhóm này. Hai trường hạn mức mới phải được cung cấp theo gói khi tạo dữ liệu; không gán hạn mức nghiệp vụ tùy ý.

Không xóa dữ liệu, không tạo lại schema, không seed gói/admin, không sửa source Backend hoặc application.properties trong nhóm 1. Chưa thay đổi bảng payments hay tạo bảng review/reset-token.

### Backup và SQL đã thực thi

Thư mục: `../database/backups/b0_group1_20261004_191811_241/`.

- [Schema trước thay đổi](../database/backups/b0_group1_20261004_191811_241/subscription_plans.before.sql)
- [SQL ALTER đã áp dụng](../database/backups/b0_group1_20261004_191811_241/applied.sql)
- [Schema sau thay đổi](../database/backups/b0_group1_20261004_191811_241/subscription_plans.after.sql)
- [SHA-256 bản sao lưu](../database/backups/b0_group1_20261004_191811_241/backup.sha256)
- [Tiện ích thực thi có kiểm tra tiền điều kiện](../database/B0Group1Migration.java)

SHA-256 đã kiểm tra độc lập bằng Get-FileHash:

```text
18a4589b5b953db4bfc0751bcb7dabbf3bd29cfcf64c260b88e2db7f53af6742
```

**Không chạy lại ALTER hoặc toàn file `stage4_schema_proposal.sql`.** Nhóm plan đã áp dụng, chạy lại sẽ trùng cột. Tiện ích migration chủ động từ chối schema không còn đúng trạng thái ban đầu. Các file này ở thư mục cha của Git project Library; cần lưu giữ cùng workspace khi sao lưu/bàn giao, không mặc định commit Library sẽ bao gồm chúng.

MySQL DDL có implicit commit; không thể hoàn tác ALTER bằng ROLLBACK. File backup dùng để lập phương án phục hồi có kiểm soát, không phải script tự động rollback trên bảng đang tồn tại. Không tự DROP bảng/cột nếu có vấn đề.

## Kiểm chứng sau thay đổi

Lần chạy cuối nhóm 1: **BUILD SUCCESS — 22 tests, 0 failures, 0 errors, 0 skipped**.

| Test | Số test | Phạm vi |
|---|---:|---|
| CatalogMappingIT | 5 | Mapping/catalog MySQL, SELECT và giá trị mặc định |
| SubscriptionPaymentMappingIT | 1 | Validate + SELECT plan/subscription/payment trên MySQL thật; lỗi thiếu admin_notes trước đây đã hết |
| MembershipVndTests | 4 | VND và chuyển đổi giá |
| PayOSMembershipTests | 9 | Tạo đơn/gateway giả lập, không gọi payOS thật |
| SubscriptionPayOSRoutingTests | 3 | Routing membership và quyền |

136 source files compile thành công. Dùng JDK 23.0.1 với release17 và Maven 3.9.16 cached, chế độ offline. Còn cảnh báo Lombok cũ và Mockito dynamic agent; không phải test failure.

Lệnh tương đương, chạy tại thư mục Library với Maven đã cài:

```powershell
mvn -o '-Dmaven.repo.local=C:\Users\APC\.m2\repository' clean compile '-Dtest=CatalogMappingIT,SubscriptionPaymentMappingIT,MembershipVndTests,PayOSMembershipTests,SubscriptionPayOSRoutingTests' test
```

Trên máy hiện tại dùng `mvn.cmd` trong Maven cache thay wrapper. Đây là nhóm test chọn lọc, không phải full suite; các test MySQL chỉ validate/đọc dữ liệu, không thử INSERT/UPDATE/DELETE. Chưa chạy lại startup toàn ứng dụng trong nhóm 1, vì lỗi thuộc nhóm 2 chưa được sửa.

## Cấu hình an toàn hiện hành

- Spring Boot 4.1.1; Java target17; payOS SDK cố định trong pom.xml.
- Database chính: `library_db1`; `spring.jpa.hibernate.ddl-auto=validate`, không dùng update/create/create-drop trên database này.
- `app.initialize-admin=false`.
- `PAYOS_ENABLED=false`, `PAYOS_CREATION_ENABLED=false` mặc định.
- Các khóa payOS phải cấu hình riêng qua môi trường; không ghi khóa thật vào README, source, commit hoặc ảnh. Thay khóa đã lộ trước khi thử thật.
- URL return/cancel do server cấu hình qua `PAYOS_RETURN_URL`/`PAYOS_CANCEL_URL`; redirect không phải bằng chứng đã thanh toán.

## Phần còn chờ — không tự triển khai tiếp

**B0 nhóm 2 đã hoàn thành**, không còn là blocker startup. Các kết quả nhóm 1 bên trên được giữ như lịch sử nghiệm thu tại thời điểm đó.

**B0 nhóm 3 đã hoàn thành:** CHECK payments.status có PROCESSING và default currency là VND. Ba nhóm đồng bộ schema đã được áp dụng; giữ payOS disabled trước kiểm thử end-to-end được duyệt.

Bước tiếp theo cần thống nhất riêng: dữ liệu thử API trên MySQL, khóa payOS mới an toàn, webhook HTTPS và số tiền thử. Chưa tự mở tunnel, đăng ký webhook, bật gateway hoặc tạo giao dịch. Startup và test hiện tại chưa chứng minh mọi API ghi dữ liệu hoặc toàn bộ business rule đã hoạt động.

## Tài liệu liên quan

- [Báo cáo triển khai Bước 6A — Auth/User, catalog, wishlist, plan và thống kê](../docs/STEP6A_RESULT.md)
- [Báo cáo triển khai Bước 6F — Subscription, Fine, Payment](../docs/STEP6F_RESULT.md)
- [Bảng đối chiếu code/test Bước 6](../docs/STEP6_TRACEABILITY.md)
- [Review MySQL và startup trước nhóm 1](../docs/PAYOS_MYSQL_STARTUP_REVIEW.md) — bằng chứng lịch sử, phần thiếu cột plan đã được xử lý ở nhóm này.
- [Báo cáo C2](../docs/PAYOS_STAGE_C2_RESULT.md)
- [Kế hoạch payOS](../docs/PAYOS_STAGE_A_REVIEW.md)
- [Đề xuất schema giai đoạn 4](../docs/STAGE4_SCHEMA_PROPOSAL.md) — bản cũ; lựa chọn VNPAY đã được thay bằng payOS, không chạy toàn SQL đề xuất.
