# CONTEXT — Đồng bộ Frontend với Backend BE-0 → BE-5

Ngày lập: **04/11/2026**  
Phạm vi: `frontend/library-frontend` đối chiếu với Backend trong `Library`  
Trạng thái: **Đã hoàn tất FE-SYNC-0 → FE-SYNC-6 về mã nguồn; chờ phiên runtime để chạy lại checklist tích hợp thủ công**

## 1. Mục tiêu

Hoàn thiện các phần Frontend còn dùng hợp đồng cũ hoặc chưa khai thác API đã có sau các giai đoạn Backend **BE-0 → BE-5**.

Kết quả cuối cần đạt:

- Frontend gửi đúng payload và chỉ hiển thị thao tác hợp lệ theo Backend.
- Các quy tắc ISBN, mật khẩu, trả sách, đặt giữ và gói thành viên thống nhất giữa hai phía.
- Không mở rộng nghiệp vụ ngoài V1 và không sửa Database.
- Thông báo hiển thị cho người dùng bằng tiếng Việt; tên biến, hàm và xử lý nội bộ bằng tiếng Anh.
- Toàn bộ test Frontend và Backend liên quan đạt sau khi hoàn tất.

## 2. Baseline đã xác nhận

- Backend BE-0 → BE-5 đã có mã triển khai tương ứng.
- Frontend hiện có **92/92 test đạt**.
- Test xanh chưa đồng nghĩa đã đồng bộ hợp đồng mới vì một số test vẫn đang xác nhận hành vi cũ:
  - bắt buộc ISBN;
  - cho phép giao lượt đặt giữ `PENDING`;
  - trả sách không gửi ghi chú.
- Working tree sạch tại thời điểm lập tài liệu.

## 3. Phạm vi đã đồng bộ tốt

| Backend | Trạng thái Frontend |
| --- | --- |
| BE-0 — JWT và profile DTO | Đã dùng Bearer token, `sessionStorage`, gọi `/api/users/profile`, tự kết thúc phiên khi nhận HTTP 401 |
| BE-1 — Lịch sử quá hạn | Đã hiển thị ngày trả, số ngày quá hạn và ghi chú đã lưu |
| BE-2 — Vòng đời đặt giữ | Đã hiển thị hàng đợi, `availableAt`, `availableUntil`, hủy và giao sách |
| BE-3 — USER mua/hủy gói | Đã nối payOS, chặn mua khi có gói active, cho mua lại sau khi hủy |
| BE-4 — Thông tin xuất bản | Đã hỗ trợ ngày đầy đủ, chỉ biết năm hoặc không rõ ngày |
| BE-5 — Test infrastructure | Thuần Backend, không cần màn hình Frontend |

## 4. Những chênh lệch cần xử lý

### Quan trọng

1. **ISBN vẫn bị bắt buộc ở Frontend** trong khi Backend cho phép để trống.
2. **Baseline khi bắt đầu FE-SYNC:** ADMIN gói thành viên mới chỉ xem và tạo, chưa sửa/xóa hoặc chạy xử lý gói hết hạn. Quy tắc xóa hiện hành được cập nhật tại AUD2-BE-04.
3. **Frontend cho phép giao đặt giữ `PENDING`**, trong khi Backend chỉ chấp nhận `AVAILABLE`.

### Cần hoàn thiện

4. Form trả sách chưa nhập và gửi `notes` dù Backend đã hỗ trợ lưu lịch sử.
5. Đăng ký và đặt lại mật khẩu chưa kiểm tra trước giới hạn **8–72 ký tự**.
6. Khi sách có bản tồn nhưng đang được giữ cho người khác, Frontend vẫn có thể hiện nút mượn; Backend sẽ từ chối an toàn. V1 ưu tiên hiển thị đúng lỗi Backend, chưa bổ sung trường API mới nếu chưa được chốt.
7. Khi quyền ADMIN bị thay đổi trong Database, Backend áp dụng ngay nhưng Frontend có thể giữ menu cũ cho đến khi tải lại profile. Đây là vấn đề đồng bộ giao diện, không phải lỗ hổng phân quyền.

## 5. Lộ trình triển khai

### FE-SYNC-0 — Khóa baseline và cập nhật test hợp đồng

Trạng thái: **Hoàn tất ngày 04/11/2026 — baseline đỏ có chủ đích**

Mục tiêu:

- Chuyển các phát hiện review thành test thất bại có chủ đích trước khi sửa.
- Không thay đổi giao diện ở giai đoạn này.

Test cần bổ sung/điều chỉnh:

- ISBN trống là hợp lệ; ISBN trên 20 ký tự vẫn bị từ chối.
- Lượt `PENDING` không được hiện thao tác giao; chỉ `AVAILABLE` hợp lệ.
- Payload check-in có thể chứa `notes`, tối đa 500 ký tự.
- Mật khẩu dưới 8 hoặc trên 72 ký tự bị chặn trước khi gọi API.
- API quản trị gói gọi đúng PUT, DELETE và POST deactivate-expired.

Tiêu chí hoàn thành:

- Các test mới mô tả đúng Backend hiện tại và thất bại vì Frontend chưa sửa.

Kết quả xác nhận:

- Toàn bộ suite hiện có **99 test: 90 đạt, 9 lỗi có chủ đích**.
- 9 lỗi được khóa theo đúng 5 nhóm hợp đồng:
  - 2 lỗi sách/ISBN: ISBN trống chưa được chấp nhận và chưa chuẩn hóa thành `null`;
  - 1 lỗi đặt giữ: `PENDING` vẫn được phép giao;
  - 2 lỗi trả sách: chưa gửi `notes` và chưa chặn ghi chú trên 500 ký tự;
  - 3 lỗi gói thành viên: thiếu `updatePlan`, `deletePlan`, `deactivateExpired`;
  - 1 lỗi mật khẩu: chưa có quy tắc dùng chung 8–72 ký tự cho đăng ký và đặt lại mật khẩu.
- Không sửa code giao diện hoặc code nghiệp vụ trong giai đoạn này.
- Lệnh kiểm tra đã chạy: `npm test`. Exit code `1` là kết quả dự kiến của baseline đỏ; 90 test ngoài phạm vi vẫn đạt.

### FE-SYNC-1 — Sách và ISBN không bắt buộc

Phụ thuộc: FE-SYNC-0.

Trạng thái: **Hoàn tất ngày 04/11/2026**

Phạm vi dự kiến:

- `src/pages/AdminLayout/bookFormRules.js`
- `src/pages/AdminLayout/AdminBooksPage.jsx`
- `tests/admin-book-form.test.mjs`

Công việc:

- Bỏ ISBN khỏi nhóm trường bắt buộc.
- Chuẩn hóa ISBN rỗng thành `null` hoặc chuỗi rỗng theo payload mà Backend đang nhận an toàn.
- Khi sửa sách:
  - đã có ISBN: tiếp tục khóa để không cho thay đổi;
  - chưa có ISBN: cho phép bổ sung một lần.
- Hiển thị `—` khi sách không có ISBN.

Tiêu chí hoàn thành:

- ADMIN thêm được sách không có ISBN.
- Có thể bổ sung ISBN cho sách ban đầu chưa có ISBN.
- Không thể đổi ISBN đã được ghi nhận.

Kết quả xác nhận:

- ISBN đã được bỏ khỏi nhóm trường bắt buộc và ISBN trống được gửi thành `null`.
- Form chỉ khóa ISBN khi sách thực sự đã có mã; sách chưa có ISBN vẫn được phép bổ sung một lần.
- Danh sách và hộp thoại chi tiết hiển thị `—` khi sách không có ISBN.
- Test sách: **9/9 đạt**.
- Toàn suite sau giai đoạn này: **100 test, 93 đạt, 7 lỗi có chủ đích** thuộc FE-SYNC-2 → FE-SYNC-5.
- ESLint riêng các file FE-SYNC-1 đạt; production build đạt.
- ESLint toàn dự án vẫn còn lỗi cũ ngoài phạm vi ở các màn hình khác và sẽ được xử lý khi nghiệm thu hoặc khi đi qua đúng phân hệ.

### FE-SYNC-2 — Vòng đời đặt giữ và thao tác giao sách

Phụ thuộc: FE-SYNC-0.

Trạng thái: **Hoàn tất ngày 04/11/2026**

Phạm vi dự kiến:

- `src/api/adminReservations.js`
- `src/pages/AdminLayout/AdminReservationsPage.jsx`
- `src/pages/Book/CheckoutAction.jsx`
- `tests/admin-reservations.test.mjs`

Công việc:

- Chỉ hiện thao tác giao khi trạng thái là `AVAILABLE`.
- Tiếp tục kiểm tra đầu hàng, còn bản sẵn và chưa hết hạn.
- Khi checkout thường bị Backend từ chối vì bản đang dành cho đặt giữ, hiển thị nguyên nhân tiếng Việt rõ ràng và không báo lỗi chung.
- Không thêm cột Database hoặc trường Backend mới trong V1.

Tiêu chí hoàn thành:

- Không còn nút giao cho `PENDING`.
- Frontend không gửi yêu cầu giao chắc chắn bị Backend từ chối.
- Lỗi “sách đang được đặt giữ và chờ nhận” được hiển thị đúng cho USER.

Kết quả xác nhận:

- `canAdminFulfill` chỉ chấp nhận trạng thái `AVAILABLE`, đồng thời vẫn kiểm tra đầu hàng, còn bản sẵn và chưa hết hạn.
- API adapter ADMIN nhận DTO đặt giữ và chặn ngay tại Frontend nếu lượt chưa đủ điều kiện; không phát sinh request `/fulfill` sai chắc chắn.
- Bảng và hộp thoại chi tiết ADMIN cùng dùng một quy tắc nên không còn nút giao cho `PENDING`.
- API client được khóa bằng test để giữ nguyên thông báo Backend “Sách đã được đặt giữ và đang chờ nhận.”; `CheckoutAction` tiếp tục hiển thị trực tiếp thông báo này cho USER.
- Không thêm cột Database hoặc trường Backend mới.
- Test FE-SYNC-2: **12/12 đạt**.
- Toàn suite sau giai đoạn này: **102 test, 96 đạt, 6 lỗi có chủ đích** thuộc FE-SYNC-3 → FE-SYNC-5.
- ESLint riêng các file FE-SYNC-2 đạt; production build đạt.

### FE-SYNC-3 — Trả sách và ghi chú lịch sử

Phụ thuộc: FE-SYNC-0.

Trạng thái: **Hoàn tất ngày 04/11/2026**

Phạm vi dự kiến:

- `src/api/adminLoans.js`
- `src/pages/AdminLayout/AdminLoansPage.jsx`
- `tests/admin-loans.test.mjs`

Công việc:

- Thêm ô ghi chú trong dialog trả sách.
- Giới hạn tối đa 500 ký tự.
- Gửi `{ bookLoanId, condition, notes }` đến API check-in.
- Nhắc ADMIN nhập mô tả khi sách `LOST` hoặc `DAMAGED`, nhưng không tự tạo tiền phạt.

Tiêu chí hoàn thành:

- Ghi chú trả sách được lưu và xuất hiện lại trong chi tiết lịch sử.
- `RETURNED` trả tồn kho; `LOST`/`DAMAGED` không trả tồn kho — Frontend chỉ phản ánh kết quả Backend, không tự tính.

Kết quả xác nhận:

- Dialog trả sách đã có trường ghi chú, bộ đếm và giới hạn tối đa 500 ký tự.
- API check-in gửi đủ `{ bookLoanId, condition, notes }`; ghi chú được chuẩn hóa trước khi gửi và adapter từ chối dữ liệu vượt giới hạn.
- Với sách `LOST` hoặc `DAMAGED`, giao diện nhắc ADMIN mô tả tình trạng và nói rõ hệ thống không tự tạo tiền phạt.
- Chi tiết lượt mượn tiếp tục đọc trường `notes` từ DTO Backend; Frontend không tự tính tồn kho hoặc tự suy diễn kết quả trả sách.
- Test mượn–trả: **5/5 đạt**.
- Toàn suite sau giai đoạn này: **102 test, 98 đạt, 4 lỗi có chủ đích** thuộc FE-SYNC-4 và FE-SYNC-5.
- ESLint riêng các file FE-SYNC-3 đạt; production build đạt.
- Không sửa Backend hoặc schema MySQL.

### FE-SYNC-4 — Quản trị vòng đời gói thành viên

Phụ thuộc: FE-SYNC-0.

Trạng thái: **Hoàn tất ngày 04/11/2026**

Phạm vi dự kiến:

- `src/api/adminMembership.js`
- `src/pages/AdminLayout/AdminSubscriptionsPage.jsx`
- `tests/admin-memberships.test.mjs`

Công việc:

- Bổ sung API adapter:
  - `PUT /api/subscription-plans/admin/{id}`;
  - `DELETE /api/subscription-plans/admin/{id}`;
  - `POST /api/subscriptions/admin/deactivate-expired`.
- Dùng chung form tạo và sửa gói.
- Thêm xác nhận xóa và hiển thị đúng kết quả Backend:
  - chưa có lịch sử: xóa cứng;
  - đã có lịch sử: API từ chối xóa bằng HTTP 409, giữ nguyên trạng thái và lịch sử.
- Thêm thao tác xử lý các đăng ký hết hạn và tải lại bảng sau khi hoàn tất.
- Không mở endpoint `/api/subscriptions/activate`; kích hoạt vẫn chỉ qua settlement payOS.

Tiêu chí hoàn thành:

- ADMIN tạo, sửa và xóa gói được từ giao diện; không có thao tác ngừng bán.
- Không làm mất lịch sử đăng ký cũ.
- Gói không hiển thị với USER vẫn có thể được xem trong khu ADMIN.

Kết quả xác nhận:

- API adapter đã nối đúng `PUT /api/subscription-plans/admin/{id}`, `DELETE /api/subscription-plans/admin/{id}` và `POST /api/subscriptions/admin/deactivate-expired`.
- Form tạo gói được dùng lại cho thao tác sửa; mã gói bị khóa khi sửa đúng với quy tắc Backend giữ mã ổn định sau khi tạo.
- Hộp thoại xác nhận giải thích rõ: gói chưa có lịch sử bị xóa cứng; gói có lịch sử sẽ bị từ chối xóa và giữ nguyên trạng thái/lịch sử; thông báo lấy từ Backend.
- Trang thành viên đăng ký có thao tác xử lý các lượt đã hết hạn và tải lại dữ liệu sau khi hoàn tất.
- Không gọi endpoint kích hoạt thủ công `/api/subscriptions/activate`; kích hoạt gói vẫn chỉ diễn ra qua settlement payOS.
- Test gói thành viên: **6/6 đạt**.
- Toàn suite sau giai đoạn này: **102 test, 101 đạt, 1 lỗi có chủ đích** thuộc FE-SYNC-5.
- ESLint riêng các file FE-SYNC-4 đạt; production build đạt.
- Không sửa Backend hoặc schema MySQL.

### FE-SYNC-5 — Validation tài khoản và đồng bộ phiên

Phụ thuộc: FE-SYNC-0.

Trạng thái: **Hoàn tất ngày 04/11/2026**

Phạm vi dự kiến:

- `src/pages/Auth/RegisterPage.jsx`
- `src/pages/Auth/ResetPasswordPage.jsx`
- `src/auth/AuthProvider.jsx`
- `src/api/client.js`
- các test auth/API liên quan

Công việc:

- Kiểm tra mật khẩu 8–72 ký tự trước khi gọi API.
- Hiển thị thông báo validation từ Backend thay vì biến mọi lỗi reset thành lỗi liên kết.
- Giữ nguyên nguyên tắc: HTTP 401 kết thúc phiên; HTTP 403 không tự xóa tài khoản USER hợp lệ.
- Khi ADMIN nhận 403 do quyền đã thay đổi, làm mới profile hoặc điều hướng phù hợp để menu không giữ vai trò cũ.

Tiêu chí hoàn thành:

- Thông báo mật khẩu đúng nguyên nhân và bằng tiếng Việt.
- USER bị đổi/xóa quyền không tiếp tục nhìn thấy khu vực ADMIN sau khi Backend đã từ chối.

Kết quả xác nhận:

- Đăng ký và đặt lại mật khẩu dùng chung quy tắc **8–72 ký tự** và chặn dữ liệu sai trước khi gọi API.
- Hai biểu mẫu hiển thị hướng dẫn giới hạn bằng tiếng Việt; thông báo validation/nghiệp vụ trả về từ Backend không còn bị thay bằng lỗi liên kết chung.
- API client tiếp tục kết thúc phiên khi nhận HTTP 401; HTTP 403 không xóa token mà phát yêu cầu đồng bộ lại profile.
- `AuthProvider` làm mới profile sau phản hồi 403. Nếu vai trò đã đổi, `RequireRole` tự loại tài khoản khỏi khu ADMIN; nếu tài khoản không còn hợp lệ, phiên bị kết thúc.
- Đã bổ sung khả năng đọc thông báo từ cả trường `message` và `Lỗi` của Backend.
- Test auth/API liên quan: **12/12 đạt**.
- Toàn suite sau giai đoạn này: **104/104 test đạt**.
- ESLint riêng các file FE-SYNC-5 đạt; production build đạt.
- Không sửa Backend hoặc schema MySQL.

### FE-SYNC-6 — Nghiệm thu đồng bộ

Phụ thuộc: FE-SYNC-1 → FE-SYNC-5.

Trạng thái: **Hoàn tất nghiệm thu mã nguồn ngày 04/11/2026**

Kiểm tra bắt buộc:

```powershell
cd frontend/library-frontend
npm test
npm run lint
npm run build
```

Kiểm tra tích hợp thủ công:

1. Thêm sách không ISBN, sau đó bổ sung ISBN khi sửa.
2. Trả sách bình thường, mất và hỏng kèm ghi chú.
3. Xác nhận chỉ đặt giữ `AVAILABLE` mới giao được.
4. Tạo, sửa, xóa gói chưa dùng; xác nhận xóa gói có lịch sử bị từ chối và không đổi trạng thái.
5. Chạy xử lý gói hết hạn và kiểm tra danh sách ADMIN/USER.
6. Đăng ký và reset với mật khẩu 7, 8, 72 và 73 ký tự.
7. Kiểm tra phiên ADMIN khi vai trò trong MySQL thay đổi.

Tiêu chí hoàn thành:

- Test, lint và build đều đạt.
- Không còn test xác nhận hợp đồng Frontend cũ.
- Không có thay đổi schema MySQL.
- Không ghi secret vào source, README hoặc Git.

Kết quả xác nhận:

- `npm test`: **104/104 test đạt**, không còn test nào xác nhận hợp đồng Frontend cũ.
- `npm run lint`: **đạt toàn bộ source và test**. Các import/prop chết đã được loại bỏ; các cập nhật state trong effect được chuyển sang vòng đời React an toàn hơn.
- `npm run build`: **đạt**, Vite tạo production bundle thành công.
- `git diff --check`: **đạt**; chỉ có cảnh báo quy ước xuống dòng LF/CRLF trên Windows, không có lỗi whitespace.
- Rà soát working tree xác nhận không thay đổi thư mục `Library` hoặc `database`, không thêm secret và không gọi endpoint kích hoạt gói thủ công `/api/subscriptions/activate`.
- Các contract ISBN, trả sách có ghi chú, đặt giữ `AVAILABLE`, vòng đời gói thành viên, mật khẩu 8–72 ký tự và đồng bộ phiên 401/403 đều có test tự động đạt.
- Tại thời điểm nghiệm thu, các cổng MySQL `3306`, Backend `8000` và Frontend `5173` đều không mở. Vì vậy 7 kịch bản tích hợp thủ công ở trên **chưa được ghi nhận là đã chạy live**; cần thực hiện lại khi ba runtime được bật và có dữ liệu thử phù hợp.

## 6. Ngoài phạm vi lộ trình này

- Import sách hàng loạt bằng giao diện; Backend `/api/books/bulk` đã sẵn sàng nhưng V1 vẫn thêm từng sách.
- Sửa hồ sơ và đổi mật khẩu khi đang đăng nhập.
- Thông báo realtime/email khi đặt giữ chuyển sang `AVAILABLE`.
- Token blacklist hoặc quản lý nhiều phiên đăng nhập.
- Thay đổi UI/UX tổng thể, màu sắc hoặc responsive ngoài phần cần thiết cho chức năng đồng bộ.

## 7. Thứ tự triển khai đề xuất

```text
FE-SYNC-0
   ├── FE-SYNC-1 — Sách/ISBN
   ├── FE-SYNC-2 — Đặt giữ
   ├── FE-SYNC-3 — Trả sách
   ├── FE-SYNC-4 — Gói thành viên
   └── FE-SYNC-5 — Tài khoản/phiên
             ↓
        FE-SYNC-6 — Nghiệm thu
```

Thực hiện tuần tự theo thứ tự **1 → 5** sẽ dễ theo dõi nhất. FE-SYNC-4 có phạm vi lớn nhất; không nên trộn với chỉnh UI/UX tổng thể.

## 8. Nhật ký trạng thái

| Giai đoạn | Trạng thái | Ghi chú |
| --- | --- | --- |
| Review Backend–Frontend | Hoàn tất | Xác định 5 chênh lệch chính và 2 vấn đề UX đồng bộ |
| FE-SYNC-0 | Hoàn tất | 99 test: 90 đạt, 9 lỗi có chủ đích để dẫn dắt FE-SYNC-1 → FE-SYNC-5 |
| FE-SYNC-1 | Hoàn tất | ISBN không bắt buộc; cho bổ sung một lần nếu ban đầu chưa có; 9/9 test sách đạt |
| FE-SYNC-2 | Hoàn tất | Chỉ giao `AVAILABLE`; adapter chặn request sai; giữ nguyên thông báo Backend; 12/12 test liên quan đạt |
| FE-SYNC-3 | Hoàn tất | Gửi ghi chú check-in tối đa 500 ký tự; nhắc mô tả sách mất/hỏng; 5/5 test mượn–trả đạt |
| FE-SYNC-4 | Hoàn tất tại thời điểm FE-SYNC; quy tắc xóa cập nhật theo AUD2-BE-04 | Tạo/sửa/xóa gói; xử lý đăng ký hết hạn; 6/6 test gói thành viên đạt ở baseline trước quyết định mới |
| FE-SYNC-5 | Hoàn tất | Mật khẩu 8–72 ký tự; giữ thông báo Backend; 401 kết thúc phiên, 403 đồng bộ lại profile; 104/104 test đạt |
| FE-SYNC-6 | Hoàn tất mã nguồn | 104/104 test, lint, build và diff check đạt; checklist tích hợp live chờ runtime 3306/8000/5173 |
