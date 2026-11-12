# Superpowers Full Project Audit Context

> **For agentic workers:** REQUIRED SUB-SKILL: sử dụng `superpowers:using-superpowers` trước mọi hành động; dùng `superpowers:systematic-debugging` khi điều tra lỗi và `superpowers:verification-before-completion` trước mọi kết luận. Chỉ dùng `superpowers:executing-plans` sau khi chủ dự án duyệt giai đoạn sửa code.

**Goal:** Review toàn bộ Library Management System bằng phương pháp audit kết hợp ma trận truy vết, từ tài liệu đến Frontend, Backend, Database, Business Logic, test và UI/UX.

**Architecture:** Audit theo hai chiều. Chiều thứ nhất kiểm tra độc lập từng tầng để tìm lỗi cục bộ; chiều thứ hai truy vết từng nghiệp vụ xuyên suốt `Tài liệu -> UI -> API -> Controller -> Service -> Repository -> MySQL -> Test -> Phản hồi UI`. Mọi kết luận phải có bằng chứng mới từ source hiện tại, không kế thừa kết luận lịch sử một cách mặc định.

**Tech Stack:** Java 17, Spring Boot, Spring Security/JWT, Spring Data JPA, MySQL, payOS, React, Vite, React Router, MUI, Tailwind CSS, Maven, npm/Node test.

**Spec:** `docs/Library_Management_System_VI.md`

## Global Constraints

- Chỉ đọc, phân tích và báo cáo trong giai đoạn audit.
- Không sửa source code, cấu hình, tài liệu khác hoặc Database khi chưa được duyệt riêng.
- Không tạo tính năng mới và không tự động khắc phục phát hiện.
- Không chạy lệnh có khả năng thay đổi dữ liệu thật.
- Không reset, checkout, clean hoặc ghi đè các thay đổi chưa commit của người dùng.
- `database/library_db1.sql` là nguồn schema MySQL chính duy nhất.
- Không sử dụng Flyway hoặc Liquibase.
- Hệ thống chỉ có hai vai trò `ROLE_ADMIN` và `ROLE_USER`.
- Xác thực hiện tại là tài khoản cục bộ bằng email/mật khẩu và JWT; không có Google OAuth.
- Thanh toán dùng payOS và VND; không dùng Razorpay hoặc Stripe.
- Giao diện và thông báo cho người dùng dùng tiếng Việt; tên xử lý nội bộ trong code dùng tiếng Anh.
- Chỉ chạy build, lint, test, startup hoặc E2E sau khi chủ dự án duyệt giai đoạn kiểm chứng.
- MySQL E2E chỉ được phép dùng Database kiểm thử riêng, không ghi vào `library_db1` đang vận hành.

## Review Focus

1. Hợp đồng giữa Frontend, Backend và MySQL không đồng nhất dù từng tầng có thể build độc lập.
2. Chuyển trạng thái sai trong mượn–trả, đặt giữ, tiền phạt, gói thành viên và thanh toán.
3. Kiểm tra quyền chỉ tồn tại ở giao diện nhưng Backend chưa thực thi, hoặc quyền Backend không khớp UI.
4. Dữ liệu lịch sử bị thay đổi/xóa ngoài ý muốn khi ADMIN sửa hoặc xóa sách, gói, tài khoản hay nghiệp vụ liên quan.
5. UI báo thành công khi giao dịch chưa được Backend/payOS xác minh, hoặc không phản hồi rõ ràng khi API thất bại.

---

## 1. Mục đích của tài liệu

Đây là tài liệu context và bảng tiến độ duy nhất cho đợt **Full Project Audit bằng Superpowers**. Tài liệu này dùng để:

- biết audit đang ở giai đoạn nào;
- giữ nguyên các quyết định phạm vi đã chốt;
- tránh kiểm tra lặp lại hoặc bỏ sót tầng;
- phân biệt rõ `đã đọc`, `đã phát hiện`, `đã kiểm chứng` và `đã sửa`;
- liên kết phát hiện giữa tài liệu, code, API, Database, test và UI/UX.

Tài liệu audit không thay thế đặc tả nghiệp vụ gốc và không tự cấp quyền sửa code.

## 2. Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| `CHƯA BẮT ĐẦU` | Chưa thu thập bằng chứng cho giai đoạn. |
| `ĐANG AUDIT` | Đang đọc và đối chiếu, chưa được kết luận. |
| `CHỜ KIỂM CHỨNG` | Đã có nhận định tĩnh nhưng cần lint/test/startup/E2E hoặc dữ liệu bổ sung. |
| `ĐÃ AUDIT` | Đã hoàn thành phạm vi đọc và có báo cáo bằng chứng. Không có nghĩa là đã sửa. |
| `CHỜ DUYỆT SỬA` | Phát hiện đã được trình bày và đang chờ chủ dự án cho phép sửa. |
| `ĐÃ SỬA` | Chỉ dùng sau khi có quyền sửa và thay đổi đã được thực hiện. |
| `ĐÃ NGHIỆM THU` | Đã có kiểm chứng mới chứng minh thay đổi đạt yêu cầu. |
| `BLOCKED` | Thiếu dữ liệu/quyền/môi trường nên chưa thể kết luận. |

## 3. Baseline dự án

### 3.1 Cấu trúc chính

| Phạm vi | Đường dẫn | Vai trò |
|---|---|---|
| Backend | `Library/` | Spring Boot API và nghiệp vụ máy chủ |
| Frontend | `frontend/library-frontend/` | React/Vite cho Public, USER và ADMIN |
| Database | `database/library_db1.sql` | Schema MySQL chính duy nhất |
| Tài liệu | `docs/` | Đặc tả, quyết định và lịch sử triển khai |
| API collection | `postman/` | Tài nguyên kiểm tra API |
| Tổng quan | `README.md` | Cấu trúc và hướng dẫn vận hành dự án |

### 3.2 Tình trạng Git tại thời điểm tạo context

- Nhánh hiện tại: `fix-5`.
- Working tree đang có nhiều file sửa đổi, xóa và file mới chưa commit.
- Audit lấy **working tree hiện tại** làm baseline.
- Không được reset hoặc loại bỏ các thay đổi này trong quá trình audit.
- Mọi báo cáo phải ghi rõ đang đánh giá file hiện tại hay nội dung trong commit gần nhất.

### 3.3 Thứ tự ưu tiên nguồn sự thật

1. Nghiệp vụ đã chốt trong `docs/Library_Management_System_VI.md` và các quyết định mới hơn được người dùng xác nhận.
2. Schema chuẩn trong `database/library_db1.sql` cùng `database/README.md`.
3. Source hiện tại trong `Library/` và `frontend/library-frontend/`.
4. Các context chuyên đề: `dbdatabase.md`, `fix-returnbook.md`, `fix-new.md`, `PAYOS.md`.
5. Các tài liệu kết quả cũ chỉ là bằng chứng lịch sử và phải được xác minh lại trước khi tái sử dụng kết luận.

## 4. Kế hoạch và tiến độ tổng thể

| Mã | Giai đoạn | Phạm vi chính | Trạng thái | Báo cáo/kết quả |
|---|---|---|---|---|
| `AUD-0` | Baseline và kiểm kê | Git, cấu trúc, dependency, tài liệu, API, bảng, route | `ĐÃ AUDIT` | Xem Mục 11 |
| `AUD-1` | Database audit | Schema, constraint, FK, index, enum, dữ liệu lịch sử | `ĐÃ AUDIT` | Xem Mục 12 |
| `AUD-2` | Backend audit | Security, API, service, transaction, integration, test | `ĐÃ AUDIT` | Xem Mục 13 |
| `AUD-3` | Frontend audit | Route, guard, API client, state, form, error handling | `ĐÃ AUDIT` | Xem Mục 14 |
| `AUD-4` | Business Logic audit | Ma trận truy vết các nghiệp vụ chính xuyên tầng | `ĐÃ AUDIT` | Xem Mục 15 |
| `AUD-5` | UI/UX audit | Public, USER, ADMIN, responsive, accessibility, copy | `ĐÃ AUDIT` | Xem Mục 16; kiểm chứng runtime chuyển sang AUD-6 |
| `AUD-6` | Kiểm chứng kỹ thuật | Lint, test, build, startup, contract, E2E có kiểm soát | `CHƯA BẮT ĐẦU` | Cần duyệt trước khi chạy |
| `AUD-7` | Tổng hợp và lộ trình sửa | P0–P3, nguyên nhân, ảnh hưởng, thứ tự sửa | `CHƯA BẮT ĐẦU` | Chưa có |

### Trạng thái hiện tại

- Phương pháp audit kết hợp ma trận truy vết: **ĐÃ CHỐT**.
- Context theo dõi audit: **ĐÃ TẠO**.
- Baseline `AUD-0`: **ĐÃ AUDIT**.
- Database audit `AUD-1`: **ĐÃ AUDIT TĨNH**.
- Backend audit `AUD-2`: **ĐÃ AUDIT TĨNH**.
- Frontend audit `AUD-3`: **ĐÃ AUDIT TĨNH**.
- Business Logic audit `AUD-4`: **ĐÃ AUDIT TĨNH**.
- UI/UX audit `AUD-5`: **ĐÃ AUDIT TĨNH**.
- Sửa code/schema/cấu hình: **CHƯA ĐƯỢC PHÉP**.

## 5. Phạm vi kiểm tra theo tầng

### 5.1 Frontend

- Cấu trúc route Public, Auth, USER và ADMIN.
- Authentication state, JWT storage, logout và route guard.
- Phân quyền hiển thị và khả năng gọi API trực tiếp.
- API adapter: URL, HTTP method, query, payload và response mapping.
- Loading, empty, success, warning và error state.
- Form validation so với Backend/Database.
- Đồng bộ dữ liệu sau create/update/delete/pay/cancel/check-in.
- Tính nhất quán tiếng Việt và thuật ngữ nghiệp vụ.
- Component lặp, component quá lớn và coupling giữa module.
- Lint/test/build chỉ thực hiện ở `AUD-6` sau khi được duyệt.

### 5.2 Backend

- SecurityConfig, JWT filter/provider và endpoint authorization.
- Controller contract, validation và HTTP status.
- Service business rules, transaction boundary và idempotency.
- Repository query, N+1, pagination và race condition.
- Exception mapping và thông báo tiếng Việt.
- Quản lý bí mật, email, upload file và payOS.
- Entity mapping so với schema MySQL.
- Unit, context, security, contract và integration test.
- Maven test/startup chỉ thực hiện ở `AUD-6` sau khi được duyệt.

### 5.3 Database

- Bảng, cột, kiểu dữ liệu, giá trị mặc định và nullability.
- Primary key, unique key, foreign key và quy tắc cascade.
- CHECK constraint so với enum Java.
- Chỉ mục dựa trên truy vấn thực tế, không thêm tràn lan.
- Bảo toàn lịch sử mượn, đặt giữ, đánh giá, gói và thanh toán.
- Schema trả sách hai bước và tiền phạt.
- Tính duy nhất của khóa giao dịch/payOS.
- Không chứa credential, mật khẩu rõ hoặc tài khoản ADMIN cố định.
- Không ALTER/import/ghi dữ liệu trong giai đoạn audit.

### 5.4 Business Logic

- Điều kiện tiền đề cho từng thao tác.
- Người/vai trò được phép thực hiện.
- State machine và chuyển trạng thái hợp lệ.
- Dữ liệu nào được tăng/giảm/cố định sau thao tác.
- Tính nguyên tử khi một nghiệp vụ cập nhật nhiều bảng.
- Tính lặp an toàn khi người dùng bấm lại hoặc webhook gửi lại.
- Trường hợp biên: hết tồn kho, quá hạn, khoản phạt chưa trả, gói hết hạn, queue cạnh tranh.
- Khả năng bảo toàn dữ liệu lịch sử sau khi tài nguyên gốc được sửa/xóa.

### 5.5 UI/UX

- Kiến trúc thông tin và mức độ dễ hiểu của luồng.
- Điều hướng, sidebar, topbar, modal, bảng và phân trang.
- Responsive ở desktop, tablet và mobile.
- Contrast, font, spacing, focus và keyboard navigation.
- Label, helper text và thông báo lỗi dễ hành động.
- Phản hồi rõ ràng sau thao tác bất đồng bộ.
- Không trùng chức năng giữa các module.
- Không dùng UI để che giấu thiếu sót phân quyền hoặc nghiệp vụ Backend.

## 6. Ma trận truy vết nghiệp vụ

Mỗi hàng chỉ được đánh dấu hoàn tất khi đã đối chiếu đủ các cột áp dụng.

| Mã | Nghiệp vụ | Spec | UI/Route | API | Service | Repository/DB | Test | UI feedback | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| `BL-01` | Đăng ký tài khoản | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-02` | Đăng nhập, JWT, logout | ✓ | ⚠ | ⚠ | ⚠ | ✓ | ◇ | ⚠ | `CÓ PHÁT HIỆN` |
| `BL-03` | Quên/đặt lại mật khẩu | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-04` | Quản lý tài khoản và phân quyền | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-05` | Sách, thể loại, tồn kho, ảnh bìa | ✓ | ⚠ | ✓ | ✓ | ✓ | ◇ | ⚠ | `CÓ PHÁT HIỆN` |
| `BL-06` | Mượn sách và giới hạn gói | ⚠ | ⚠ | ✓ | ✓ | ✓ | ◇ | ✓ | `CẦN CHỐT` |
| `BL-07` | Gia hạn `min(14, hạn mức gói)` | ⚠ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `LỆCH TÀI LIỆU` |
| `BL-08` | USER yêu cầu trả sách | ⚠ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `LỆCH TÀI LIỆU` |
| `BL-09` | ADMIN check-in sách bình thường | ⚠ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `LỆCH TÀI LIỆU` |
| `BL-10` | Trả quá hạn và tiền phạt | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-11` | Hư hỏng nhẹ 25% | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-12` | Hư hỏng nặng 75% | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-13` | Mất sách 100% + 20.000đ | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-14` | Đặt giữ yêu cầu gói active | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-15` | Queue đặt giữ và nhận sách | ✓ | ⚠ | ✓ | ✓ | ✓ | ◇ | ✓ | `CẦN CHỐT` |
| `BL-16` | Hết hạn/hủy đặt giữ | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-17` | Mua và kích hoạt gói thành viên | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-18` | Hủy, sửa, xóa gói và lịch sử | ⚠ | ⚠ | ⚠ | ⚠ | ✓ | ◇ | ⚠ | `CÓ PHÁT HIỆN` |
| `BL-19` | Thanh toán gói bằng payOS | ✓ | ⚠ | ⚠ | ⚠ | ⚠ | ◇ | ⚠ | `CÓ PHÁT HIỆN` |
| `BL-20` | Thanh toán tiền phạt bằng payOS | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ◇ | ⚠ | `CÓ PHÁT HIỆN` |
| `BL-21` | Webhook, đối soát và idempotency | ✓ | ✓ | ✓ | ⚠ | ⚠ | ◇ | ⚠ | `CÓ PHÁT HIỆN` |
| `BL-22` | Đánh giá sách sau khi đã đọc | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ◇ | ⚠ | `CẦN CHỐT` |
| `BL-23` | Wishlist | ✓ | ✓ | ✓ | ✓ | ✓ | ◇ | ✓ | `CHỜ AUD-6` |
| `BL-24` | Thông báo ADMIN và USER | ✓ | ⚠ | — | — | — | ◇ | ⚠ | `CÓ PHÁT HIỆN` |

Quy ước riêng của ma trận sau `AUD-4`: `✓` = khớp khi đọc tĩnh; `⚠` = có phát hiện hoặc quyết định
chưa chốt; `◇` = có test/source kiểm thử liên quan nhưng chưa chạy; `—` = không áp dụng theo phạm vi V1.
`CHỜ AUD-6` không có nghĩa là đã pass runtime.

## 7. Phân loại phát hiện

| Mức | Tiêu chí |
|---|---|
| `P0` | Mất dữ liệu, lộ bí mật/quyền, ghi nhận tiền sai hoặc hệ thống không thể vận hành. |
| `P1` | Sai nghiệp vụ chính, vượt quyền, sai tồn kho/trạng thái hoặc giao dịch không nhất quán. |
| `P2` | Lỗi chức năng có đường vòng, hợp đồng API lệch, validation/UX gây nhầm lẫn đáng kể. |
| `P3` | Chất lượng code, tính nhất quán giao diện, accessibility, hiệu năng nhỏ hoặc tài liệu lệch nhẹ. |

Mỗi phát hiện phải có tối thiểu:

- mã phát hiện;
- mức ưu tiên;
- nghiệp vụ và tầng bị ảnh hưởng;
- file/dòng hoặc bảng/cột liên quan;
- bằng chứng quan sát được;
- hành vi mong đợi;
- nguyên nhân gốc nếu đã đủ bằng chứng;
- cách kiểm chứng còn thiếu;
- đề xuất, chưa phải quyền triển khai.

## 8. Cổng kiểm soát trước khi chuyển giai đoạn

### Từ audit tĩnh sang kiểm chứng kỹ thuật

Chỉ chuyển sang `AUD-6` sau khi chủ dự án duyệt rõ các lệnh được phép chạy. Ưu tiên theo thứ tự:

1. Lệnh chỉ đọc và static analysis.
2. Frontend lint/test/build.
3. Backend compile/unit/security/context test.
4. Backend startup với schema validation.
5. Contract/integration test trên Database `_test`.
6. E2E có kiểm soát.
7. Giao dịch payOS thật chỉ khi có phê duyệt riêng.

### Từ audit sang sửa code

Không sửa ngay sau khi phát hiện. Trình tự bắt buộc:

1. Báo cáo phát hiện và bằng chứng.
2. Xác nhận quy tắc nghiệp vụ với chủ dự án nếu tài liệu chưa rõ.
3. Chốt phạm vi sửa và tác động Database/API/UI.
4. Lập kế hoạch sửa có test.
5. Chờ duyệt.
6. Triển khai bằng `superpowers:test-driven-development` và `superpowers:executing-plans` hoặc phương thức được chủ dự án chọn.
7. Dùng `superpowers:verification-before-completion` trước khi kết luận.

## 9. Nhật ký tiến độ

| Ngày | Giai đoạn | Hoạt động | Kết quả |
|---|---|---|---|
| 2026-11-12 | Khởi tạo | Chốt phương án audit kết hợp ma trận truy vết | Đã duyệt phương pháp |
| 2026-11-12 | Khởi tạo | Tạo `docs/superpowers.md` | Context được khởi tạo; chưa audit source chi tiết |
| 2026-11-12 | AUD-0 | Kiểm kê Git, source, dependency, API, route, schema, test, cấu hình và tài liệu | Hoàn tất baseline read-only; không build/test/startup/kết nối DB |
| 2026-11-12 | AUD-1 | Đối chiếu schema canonical với entity, enum, repository, constraint, FK, index và test contract | Hoàn tất audit tĩnh; không chạy test, không kết nối MySQL và không ALTER/import dữ liệu |
| 2026-11-12 | AUD-2 | Rà Security/JWT, controller contract, service, transaction/lock, payOS, upload và test map | Hoàn tất audit tĩnh; không chạy Maven, không startup, không gọi API và không sửa source/cấu hình/Database |
| 2026-11-12 | AUD-3 | Rà route/guard, auth state, API client, form/state bất đồng bộ, USER/ADMIN, settings và test map Frontend | Hoàn tất audit tĩnh; không chạy npm lint/test/build, không mở trình duyệt và không sửa source/cấu hình |
| 2026-11-12 | AUD-4 | Truy vết 24 nghiệp vụ qua tài liệu, UI, API, service, repository/DB, test và phản hồi | Hoàn tất audit tĩnh; ghi nhận một lệch tài liệu mới, gom phát hiện xuyên tầng và ba quyết định cần chốt; không chạy test/runtime hoặc sửa source/schema |
| 2026-11-12 | AUD-5 | Rà Public, Auth, USER, ADMIN, responsive, accessibility, keyboard/focus, copy và trạng thái giao diện dùng chung | Hoàn tất audit tĩnh; ghi nhận 2 phát hiện P2 và 2 phát hiện P3; không mở trình duyệt, không chạy Lighthouse/axe, không build/test và không sửa source/cấu hình |

## 10. Điểm bắt đầu tiếp theo

Giai đoạn kế tiếp sau khi chủ dự án duyệt tài liệu này:

### `AUD-6 — Kiểm chứng kỹ thuật`

- chạy lint, test và build theo từng tầng sau khi chủ dự án duyệt quyền kiểm chứng;
- kiểm tra responsive, keyboard/focus, accessible name, contrast và zoom bằng trình duyệt;
- kiểm tra startup/contract/E2E trên môi trường kiểm thử, không ghi vào Database vận hành;
- thu thập bằng chứng pass/fail mới, không suy ra kết quả runtime từ audit tĩnh.

## 11. Kết quả AUD-0 — Baseline và kiểm kê

Ngày thực hiện: **12/11/2026**  
Phương thức: **read-only static inventory**  
Trạng thái: **ĐÃ AUDIT**

### 11.1. Phạm vi đã đọc

- Cấu trúc thư mục gốc, Backend, Frontend, Database, tài liệu và Postman.
- Trạng thái Git, diff stat và các file chưa commit.
- `pom.xml`, `package.json`, Vite proxy và tên khóa cấu hình Backend/Frontend.
- Danh sách controller/API annotation, service, entity, repository và enum.
- Route Frontend, API adapter, module trang và test inventory.
- DDL trong `database/library_db1.sql` và quy ước trong `database/README.md`.
- Tài liệu đặc tả cùng các context gần nhất về Database, trả sách, FIX-NEW và payOS.

Không đọc giá trị trong `.env.local`, không in giá trị secret và không kết nối dịch vụ đang chạy.

### 11.2. Git baseline

| Hạng mục | Kết quả |
|---|---:|
| Nhánh | `fix-5` |
| File modified | 25 |
| File deleted | 6 |
| File untracked | 12 |
| Tổng mục thay đổi trong working tree | 43 |
| File staged | 0 |

Quyết định baseline:

- audit working tree hiện tại, không chỉ commit gần nhất;
- không reset/checkout/clean các thay đổi của người dùng;
- mọi nhận xét sau này phải ghi file đang ở trạng thái tracked-modified, deleted hay untracked nếu điều đó ảnh hưởng kết luận;
- `frontend-full-code.txt` và `frontend-user-code.txt` xuất hiện ở lần quét đầu nhưng không còn tồn tại
  tại lần kiểm chứng cuối. Các lệnh AUD-0 không xóa hai file này; đây được ghi nhận là thay đổi working
  tree xảy ra đồng thời trong lúc audit. Hai snapshot không thuộc baseline cuối và không phải source thực thi.

### 11.3. Backend inventory

| Thành phần | Số lượng |
|---|---:|
| Java main | 152 file |
| Controller | 17 |
| Operation có annotation HTTP | 76 |
| Service interface | 14 |
| Service implementation/support trong `service/impl` | 23 |
| Entity/model | 12 |
| Repository | 12 |
| Domain enum | 10 |
| Configuration class | 6 |
| Java test | 61 file |

Các API base chính:

- `/auth`;
- `/api/users`;
- `/api/books` và `/api/admin/book`;
- `/api/admin/books/covers` và `/api/book-covers/{filename}`;
- `/api/genres`;
- `/api/book-loans`;
- `/api/reservations`;
- `/api/reviews`;
- `/api/wishlist`;
- `/api/subscription-plans` và `/api/subscriptions`;
- `/api/fines`;
- `/api/payments` được chia giữa `PaymentController` và `PayOSController`.

Test Backend hiện có 46 file trực tiếp dưới package test gốc, 11 file cấu hình/security,
1 file controller và 3 file test support. Maven định nghĩa suite mặc định cùng hai profile opt-in
`mysql-contract` và `mysql-e2e`; chưa chạy profile nào trong AUD-0.

### 11.4. Frontend inventory

| Thành phần | Số lượng |
|---|---:|
| Source code/CSS dưới `src` | 130 file |
| Page code | 80 file |
| Component code | 12 file |
| API adapter | 18 file |
| Test Node | 26 file |
| Phần tử `<Route>` trong `App.jsx` | 55 |

Các nhóm route đã nhận diện:

- Public: trang chủ, danh mục công khai, chi tiết sách, giới thiệu và liên hệ;
- Auth: đăng nhập, đăng ký, quên/đặt lại mật khẩu và 403;
- Demo/preview;
- USER có guard `ROLE_USER` hoặc `ROLE_ADMIN`;
- ADMIN có guard `ROLE_ADMIN`;
- các route redirect tương thích cũ và route 404.

Frontend dùng React `19.2.8`, React Router `7.18.4`, Vite `8.3.0`, MUI `9.4.0`,
Tailwind CSS `4.3.3` và `qrcode.react`. Vite proxy `/api` và `/auth` tới
`http://localhost:8000`.

`node_modules/` và `dist/` tồn tại cục bộ nhưng là dependency/build output, không thuộc phạm vi
source audit. `.env.local` tồn tại, được ignore và không được Git theo dõi; AUD-0 không đọc nội dung.

### 11.5. Database inventory

Schema chính có 12 bảng:

1. `users`;
2. `genres`;
3. `books`;
4. `subscription_plans`;
5. `subscriptions`;
6. `book_loans`;
7. `fines`;
8. `reservations`;
9. `wishlists`;
10. `book_reviews`;
11. `password_reset_tokens`;
12. `payments`.

Thống kê DDL tĩnh:

| Loại | Số lần ghi nhận trong schema |
|---|---:|
| Primary key | 12 |
| Foreign key | 22 |
| UNIQUE/UNIQUE KEY | 11 |
| CHECK constraint | 45 |
| INDEX/CREATE INDEX | 13 |

`database/library_db1.sql` và `database/README.md` là hai tài nguyên Database canonical được Git
theo dõi. Các file `b0_*`, Java migration, proposal và `backups/` là tài nguyên lịch sử/công cụ cũ,
đang bị ignore và không được dùng để dựng Database.

Các con số trên là inventory cú pháp, chưa chứng minh constraint/index đúng nghiệp vụ; việc đối chiếu
thuộc `AUD-1`.

### 11.6. Dependency và bề mặt cấu hình

Backend baseline:

- Java 17;
- Spring Boot parent `4.1.1`;
- payOS Java SDK `2.0.1`;
- Spring Security/JWT, JPA/JDBC, Validation, Mail, MySQL runtime và H2 test.

`application.properties` có 41 khóa cấu hình. Những nhóm nhạy cảm như JWT, DB password, mail password,
ADMIN password và khóa payOS đều được biểu diễn qua biến môi trường/default placeholder; không phát hiện
khóa nhạy cảm dạng literal trong lần kiểm kê theo tên khóa. AUD-0 chưa đánh giá độ an toàn của giá trị
default hoặc môi trường runtime; nội dung đó thuộc `AUD-2`.

Frontend nhận hai khóa môi trường đã tham chiếu trong source:

- `VITE_API_BASE_URL`;
- `VITE_PAYMENTS_ENABLED`.

### 11.7. Bản đồ tài liệu

| Nhóm | Nguồn |
|---|---|
| Đặc tả nghiệp vụ chính | `docs/Library_Management_System_VI.md` |
| Schema canonical | `database/library_db1.sql`, `database/README.md` |
| Database/backend context | `docs/dbdatabase.md`, `docs/DB0_*`–`DB3_*`, `docs/BE0_*`–`BE5_*` |
| Trả sách và tiền phạt | `docs/fix-returnbook.md` |
| Follow-up Backend/Frontend | `docs/fix-new.md` |
| payOS | `docs/PAYOS.md` |
| Lịch sử review cũ | `docs/STEP6*`, `docs/STEP7_FINAL_REVIEW.md`, `docs/AD9_ADMIN_ACCEPTANCE.md` |
| Theo dõi Full Audit hiện tại | `docs/superpowers.md` |

Thư mục `docs/` hiện có 34 file Markdown. Các số liệu test/build trong tài liệu là bằng chứng lịch sử;
không được dùng để tuyên bố working tree hiện tại đang pass nếu chưa chạy lại tại `AUD-6`.

Postman canonical có 15 file, hiện chủ yếu bao phủ đăng nhập ADMIN, Books và Genres. Đây chưa phải
collection đầy đủ tương ứng với 76 operation Backend; độ phủ contract sẽ được đánh giá tại `AUD-2` và
`AUD-4`.

### 11.8. Sổ xung đột/điểm cần xác minh sau baseline

Các mục dưới đây là **điểm định tuyến cho audit sau**, chưa phải kết luận lỗi code:

| ID | Quan sát baseline | Giai đoạn xử lý |
|---|---|---|
| `CTX-01` | Đặc tả chính vẫn mô tả `POST /api/fines` để ADMIN tạo phạt thủ công, trong khi `fix-new.md` chốt V1 chỉ phát sinh phạt qua ADMIN check-in và ghi endpoint này đã bị chặn. | `AUD-2`, `AUD-4` |
| `CTX-02` | Đặc tả/README Backend vẫn mô tả plan có lịch sử sẽ `active=false` để ngừng bán; quyết định mới nhất của chủ dự án là giao diện chỉ Sửa/Xóa và không có “ngừng bán”. Cần phân biệt hành vi UI với bảo toàn FK/lịch sử ở Backend. | `AUD-1`, `AUD-4`, `AUD-5` |
| `CTX-03` | Đặc tả vẫn có ADMIN checkout/cấp sách trực tiếp. Chủ dự án đã nêu lo ngại thao tác này trùng với Đặt giữ nhưng chưa có bản quyết định đồng bộ trong tài liệu canonical. | `AUD-4` |
| `CTX-04` | `Library/README.md` tổng hợp nhiều mốc cũ với trạng thái cổng/MySQL/test khác nhau; không thể dùng như bằng chứng runtime hiện tại. | `AUD-6`, `AUD-7` |
| `CTX-05` | `PaymentController` và `PayOSController` cùng dùng base `/api/payments`; cần kiểm tra method path, quyền và contract có xung đột hay không. | `AUD-2` |
| `CTX-06` | Postman chỉ bao phủ một phần nhỏ API hiện có. | `AUD-2`, `AUD-6` |
| `CTX-07` | Có nhiều file source/tài liệu untracked; kết luận audit phải dựa trên working tree và không được bỏ sót file chưa commit. | Tất cả giai đoạn |
| `CTX-08` | Hai snapshot Frontend untracked biến mất giữa lần quét đầu và lần kiểm chứng cuối dù AUD-0 không có lệnh xóa. Working tree có thể đang được chỉnh đồng thời; mỗi giai đoạn phải chụp lại status trước khi kết luận. | Tất cả giai đoạn |

### 11.9. Những việc AUD-0 không thực hiện

- Không chạy Maven compile/test/package hoặc Spring Boot startup.
- Không chạy npm lint/test/build/dev/preview.
- Không kết nối MySQL, không đọc schema live và không chạy `EXPLAIN`.
- Không gọi API localhost, payOS, SMTP hoặc Cloudflare tunnel.
- Không sửa source, cấu hình, schema hoặc dữ liệu.
- Chỉ cập nhật tài liệu tracker `docs/superpowers.md` theo yêu cầu theo dõi tiến độ.

### 11.10. Kết luận chuyển giai đoạn

`AUD-0` đáp ứng đủ inventory cho source/module/API/entity/repository/table/route, dependency, cấu hình,
tài liệu và working tree. Giai đoạn tiếp theo là `AUD-1 — Database audit`, vẫn theo chế độ read-only
và chưa kết nối MySQL live.

## 12. Kết quả AUD-1 — Database audit

Ngày thực hiện: **12/11/2026**  
Phương thức: **read-only static schema/entity/repository audit**  
Trạng thái: **ĐÃ AUDIT** trong phạm vi source hiện tại; **CHƯA KIỂM CHỨNG schema MySQL live**

### 12.1. Phạm vi và giới hạn bằng chứng

Đã đọc và đối chiếu:

- toàn bộ `database/library_db1.sql` và `database/README.md`;
- 12 entity trong `Library/src/main/java/com/library/model`;
- 10 enum trong `Library/src/main/java/com/library/domain`;
- 12 repository cùng các truy vấn derived/JPQL hiện có;
- cấu hình Hibernate `ddl-auto=validate`;
- các test mapping/metadata MySQL opt-in và cấu hình profile Maven tương ứng;
- các quyết định gần nhất về RB-1, tiền phạt, gói thành viên, payOS và bảo toàn lịch sử.

Không chạy Maven, không kết nối MySQL, không chạy `EXPLAIN`, không đọc dữ liệu live và không
ALTER/import/ghi Database. Vì vậy kết quả này chứng minh quan hệ trong **working tree hiện tại**, không
chứng minh `library_db1` đang chạy ngoài máy đã đồng bộ hoàn toàn với file SQL.

`database/library_db1.sql` đang là file tracked-modified trong working tree: phần Google cũ đã bị loại
khỏi `users`; các cột/ràng buộc RB-1 và unique tiền phạt đã được thêm nhưng chưa thuộc commit baseline.

### 12.2. Đối chiếu bảng và entity

Kiểm tra tự động chỉ đọc xác nhận:

- `12` bảng `CREATE TABLE`;
- `12` entity có `@Table`;
- tập tên bảng khớp chính xác `12/12`;
- không có entity mồ côi hoặc bảng nghiệp vụ thiếu entity.

| Bảng | Entity | Kết quả mapping tĩnh | Ghi chú |
|---|---|---|---|
| `users` | `User` | Khớp | Email unique, role dạng chuỗi, password bắt buộc, không còn cột Google. |
| `genres` | `Genre` | Khớp | Có quan hệ cha–con tự tham chiếu; code unique. |
| `books` | `Book` | Khớp | ISBN nullable/unique; ngày và năm xuất bản loại trừ nhau; tồn kho có CHECK. |
| `subscription_plans` | `SubscriptionPlan` | Khớp phần đang dùng | Database còn 5 cột không được entity quản lý; xem `AUD1-DB-06`. |
| `subscriptions` | `Subscription` | Khớp | Lưu snapshot tên/mã/giá/hạn mức, giúp bảo toàn lịch sử. |
| `book_loans` | `BookLoan` | Khớp | Đủ cột RB-1: yêu cầu trả, ADMIN check-in và ghi chú kiểm tra. |
| `fines` | `Fine` | Khớp | Có unique `(book_loan_id, type)` để chặn phạt trùng cùng loại. |
| `reservations` | `Reservation` | Khớp | Đủ trạng thái, queue và mốc available/fulfilled/cancelled. |
| `wishlists` | `Wishlist` | Khớp | Unique người dùng–sách. |
| `book_reviews` | `BookReview` | Có lệch contract nội dung | Database bắt buộc 10–2000 ký tự nhưng request/entity cho phép rỗng; xem `AUD1-DB-01`. |
| `password_reset_tokens` | `PasswordResetToken` | Khớp | Token unique và có ngày hết hạn. |
| `payments` | `Payment` | Khớp phần đang dùng | Database còn `payment_method`, `metadata`; thiếu CHECK quan hệ mục tiêu; xem `AUD1-DB-02`, `AUD1-DB-06`. |

Kiểu dữ liệu chính khớp ý nghĩa Java/MySQL: `LocalDate`–`DATE`, `LocalDateTime`–`DATETIME/TIMESTAMP`,
`BigDecimal`–`DECIMAL(10,2)`, tiền đã chốt theo VND–`BIGINT`, enum–`VARCHAR`, boolean–`BOOLEAN`.
Các giá trị mặc định của entity builder đang khớp mặc định Database đối với user, thể loại, sách,
subscription, loan, fine, reservation và payment.

### 12.3. Enum và CHECK constraint

Đối chiếu tập giá trị theo tên, không phụ thuộc thứ tự, cho kết quả:

| Java enum | CHECK Database | Số giá trị | Kết quả |
|---|---|---:|---|
| `UserRole` | `chk_users_role` | 2 | Khớp |
| `BookLoanType` | `chk_book_loans_type` | 3 | Khớp |
| `BookLoanStatus` | `chk_book_loans_status` | 5 | Khớp |
| `FineType` | `chk_fines_type` | 4 | Khớp |
| `FineStatus` | `chk_fines_status` | 4 | Khớp |
| `ReservationStatus` | `chk_reservations_status` | 5 | Khớp |
| `PaymentType` | `chk_payments_payment_type` | 4 | Khớp |
| `PaymentStatus` | `chk_payments_status` | 6 | Khớp |
| `PaymentGateway` | `chk_payments_gateway` | 1 (`PAYOS`) | Khớp |

`BookDamageLevel` không được lưu thành cột riêng; đây là input thẩm định để service tính phạt và trạng
thái cuối vẫn lưu bằng `BookLoanStatus`, nên không cần CHECK tương ứng.

Các điểm tích cực khác:

- `books.available_copies` bị chặn âm và không thể vượt `total_copies`;
- chỉ được lưu một trong `publication_date` hoặc `publication_year`;
- ngày kết thúc subscription không thể trước ngày bắt đầu;
- hạn trả/return date không thể trước checkout date;
- RB-1 chặn `checked_in_at` trước yêu cầu trả và yêu cầu trạng thái cuối khi có check-in;
- amount/amount_paid/retry_count và queue position có giới hạn cơ bản;
- payment gateway chỉ còn `PAYOS`, không còn Razorpay/Stripe trong CHECK.

### 12.4. FK, xóa và bảo toàn lịch sử

Schema có `22` foreign key. Không foreign key nào khai báo `ON DELETE CASCADE`; MySQL vì vậy dùng hành
vi mặc định chặn xóa hàng cha còn được tham chiếu.

| Tài nguyên muốn xóa | Quan hệ chặn xóa cứng khi đã có lịch sử | Kết luận |
|---|---|---|
| Người dùng | subscription, loan, fine, reservation, wishlist, review, reset token, payment và dấu ADMIN check-in/xử lý phạt | Bảo toàn lịch sử và audit actor. |
| Thể loại | sách con trực tiếp và thể loại con | Không xóa khi còn cây/sách phụ thuộc. |
| Sách | loan, reservation, wishlist, review | Chỉ xóa cứng khi thật sự chưa có liên kết. |
| Gói thành viên | subscription | Gói chưa từng được mua có thể xóa cứng; có lịch sử thì FK chặn. |
| Subscription | payment | Không mất bằng chứng thanh toán gói. |
| Loan | fine và payment | Không mất nguồn phát sinh phạt/thanh toán. |
| Fine | payment | Không mất đối soát khoản phạt. |

Thiết kế này phù hợp quyết định gần nhất: ADMIN có quyền yêu cầu xóa, nhưng Database chỉ cho xóa cứng
khi không có lịch sử liên kết. Cột `active` của gói vẫn tồn tại và dữ liệu cũ có thể còn trạng thái ẩn;
việc có tiếp tục dùng “ngừng bán” hay chỉ Sửa/Xóa là quyết định contract/UI cần chốt ở `AUD-4`, không
phải lý do bỏ FK lịch sử.

### 12.5. Phát hiện cần xử lý sau audit

#### `AUD1-DB-01` — P2 — Contract nội dung đánh giá không đồng nhất

- **Bằng chứng:** `database/library_db1.sql:569,580` bắt `review_text NOT NULL` và dài `10–2000`;
  `CreateReviewRequest.java:23-24`, `UpdateReviewRequest.java:20-21` chỉ giới hạn tối đa và cho phép null;
  `BookReview.java:35-36` cũng không khai báo `nullable=false`.
- **Hành vi hiện tại:** `BookReviewServiceImpl.java:142-152` chèn ký tự zero-width cho nội dung ngắn/rỗng,
  rồi `BookReviewMapper.java:15-17` loại ký tự đó khi trả API.
- **Ảnh hưởng:** Database lưu nội dung không đúng nguyên văn; đường ghi khác service này có thể bị CHECK
  từ chối dù DTO/entity cho là hợp lệ; Hibernate `validate` không phát hiện lệch nghiệp vụ này.
- **Nguyên nhân gốc:** API chọn “nội dung tùy chọn”, còn schema cũ chọn “tối thiểu 10 ký tự”.
- **Cần chốt trước khi sửa:** hoặc cho phép đánh giá chỉ có số sao và nới schema, hoặc bắt buộc tối thiểu
  10 ký tự hiển thị ở DTO/UI và bỏ cơ chế padding vô hình.

#### `AUD1-DB-02` — P2 — Payment chưa có ràng buộc quan hệ mục tiêu

- **Bằng chứng:** `database/library_db1.sql:598-602` cho `book_loan_id`, `subscription_id`, `fine_id` đều
  nullable; CHECK tại `679-704` chỉ kiểm tra enum type/status/gateway.
- **Hành vi hiện tại:** service tạo payment gói với `subscription`, payment phạt với `fine + bookLoan`,
  và settlement kiểm tra lại quan hệ trước khi ghi nhận thành công.
- **Khoảng trống:** Database vẫn chấp nhận `MEMBERSHIP` không có subscription, `FINE` không có fine,
  hoặc một payment đồng thời trỏ nhiều mục tiêu nếu có đường ghi khác/bug sau này.
- **Đề xuất:** ở giai đoạn sửa, chốt ma trận `payment_type -> FK bắt buộc/được null` rồi bổ sung CHECK
  tương ứng và test metadata/insert âm tính. Chưa ALTER trong AUD-1.

#### `AUD1-DB-03` — P2 — Quy tắc gói thành viên mạnh hơn schema

- **Bằng chứng:** entity `SubscriptionPlan.java:37-51` dùng `@Positive` cho giá, số sách và số ngày;
  payOS chỉ chấp nhận giá VND dương. Database hiện chỉ có `price >= 0`, không CHECK
  `max_books_allowed`, `max_days_per_book` và không giới hạn `currency='VND'` tại
  `database/library_db1.sql:147-214`.
- **Ảnh hưởng:** dữ liệu ghi ngoài validation Java có thể tạo gói giá `0`, hạn mức âm/0 hoặc currency
  khác VND; gói đó tồn tại trong Database nhưng không thể đi qua luồng mua hiện tại.
- **Đề xuất:** cân bằng CHECK của `subscription_plans` với contract V1 sau khi xác nhận có hay không gói
  miễn phí. Bảng snapshot `subscriptions` đã có CHECK hạn mức dương.

#### `AUD1-DB-04` — P3 — Có truy vấn chưa có index trực tiếp phù hợp

- `ReservationRepository.java:21-25` quét reservation `AVAILABLE` theo `available_until` và sắp theo ID,
  nhưng schema chỉ có index bắt đầu bằng `book_id` hoặc `user_id` tại `library_db1.sql:498-502`.
  Candidate cần kiểm chứng: `(status, available_until, id)`.
- `BookLoanRepository.java:66-71` phân trang theo khoảng `checkout_date`, nhưng chưa có index bắt đầu bằng
  `checkout_date`.
- Đây là phát hiện hiệu năng tĩnh, không phải bằng chứng truy vấn đang chậm. Chỉ cân nhắc index sau khi
  chạy `EXPLAIN`/đo trên Database kiểm thử có dữ liệu đại diện tại `AUD-6`.

#### `AUD1-DB-05` — P2 — File canonical tạo mới được nhưng không nâng cấp schema đang tồn tại

- **Bằng chứng:** cả 12 bảng đều dùng `CREATE TABLE IF NOT EXISTS`; file có `0` câu `ALTER TABLE`.
  `database/README.md:5-12` xác định đây là nguồn duy nhất, không dùng Flyway/Liquibase;
  `application.properties:36` chỉ dùng Hibernate `validate`.
- **Ảnh hưởng:** chạy lại file trên Database cũ không thêm cột, CHECK, FK hoặc index mới. `validate` có
  thể bắt một số lệch mapping cột nhưng không chứng minh toàn bộ constraint/index khớp canonical.
- **Kết luận:** file đủ để dựng Database mới; chưa phải cơ chế upgrade lặp lại an toàn. Vì dự án đã chốt
  không dùng migration framework, mỗi thay đổi schema cần quy trình backup + ALTER thủ công có kiểm tra
  metadata, hoặc dựng lại Database mới theo kế hoạch bảo toàn dữ liệu.

#### `AUD1-DB-06` — P3 — Cột/giá trị legacy chưa có chủ sở hữu runtime rõ ràng

- `subscription_plans` còn `billing_cycle`, `trial_days`, `max_users_allowed`, `features`, `auto_renew`
  nhưng `SubscriptionPlan` không ánh xạ các trường này.
- `payments` còn `payment_method`, `metadata` nhưng `Payment` không ánh xạ.
- `LOST_BOOK_PENALTY` và `DAMAGED_BOOK_PENALTY` vẫn có trong enum/CHECK/UI ADMIN, trong khi luồng phạt
  payOS hiện tạo `PaymentType.FINE` cho mọi loại fine.
- Các cột bắt buộc chưa ánh xạ đều có default nên chưa làm hỏng INSERT hiện tại. Đây là nợ mô hình/tài
  liệu, không phải lỗi runtime đã được chứng minh. `AUD-4` cần chốt giữ cho tương lai hay loại bỏ có kiểm soát.

#### `AUD1-DB-07` — P3 — Kiểm thử schema là opt-in và mới bao phủ một phần

- Maven mặc định loại `*IT.java` tại `Library/pom.xml:174-183`; mapping/metadata MySQL chỉ chạy qua
  profile `mysql-contract` tại `191-212`.
- `PaymentSchemaContractIT` kiểm tra 12 bảng và một tập constraint/index quan trọng, nhưng chưa assert
  đầy đủ cột/CHECK/index RB-1, contract review text, quan hệ mục tiêu payment hoặc toàn bộ 45 CHECK.
- Đây là khoảng trống kiểm chứng, không phải khẳng định schema live sai. Chỉ chạy profile trên Database
  `_test` sau khi được duyệt ở `AUD-6`.

### 12.6. Index đã phù hợp với truy vấn chính

| Nghiệp vụ | Index hiện có | Đánh giá tĩnh |
|---|---|---|
| Loan theo user/status và book/status | `idx_book_loans_user_status`, `idx_book_loans_book_status` | Phù hợp left-prefix. |
| Batch quá hạn | `idx_book_loans_status_due_id` | Phù hợp status + due date + keyset ID. |
| Hàng đợi USER yêu cầu trả | `idx_book_loans_return_queue` | Phù hợp `checked_in_at IS NULL`, thời điểm yêu cầu và ID. |
| Subscription active theo user/thời gian | `idx_subscriptions_user_active_period` | Phù hợp truy vấn quyền lợi đang hiệu lực. |
| Batch hết hạn subscription | `idx_subscriptions_active_end_date` | Phù hợp. |
| Queue reservation theo sách | `idx_reservations_book_status_queue` | Phù hợp. |
| Chặn reservation trùng theo user/book/status | `idx_reservations_user_book_status` | Phù hợp. |
| Fine theo user/status/type/thời gian | `idx_fines_user_status_type_created` | Phù hợp khi lọc theo user; dynamic filter khác cần đo. |
| Payment gần nhất theo fine/subscription và gateway | hai index `*_gateway_id` | Phù hợp repository hiện tại. |
| Review hiển thị theo sách | `idx_book_reviews_book_active_created` | Phù hợp. |

Unique key đáng chú ý:

- email, mã thể loại, ISBN nullable, tên/mã gói;
- một wishlist và một review cho mỗi cặp user–book;
- một fine cho mỗi cặp loan–fine type;
- transaction ID và gateway order ID của payment.

### 12.7. Kết luận AUD-1

- Không phát hiện `P0` hoặc `P1` từ audit tĩnh Database.
- Ghi nhận `4` phát hiện `P2` và `3` phát hiện `P3`; chưa có mục nào được sửa.
- 12 bảng/entity, các enum lưu trữ và phần RB-1 đang đồng bộ ở mức source hiện tại.
- Cấu trúc FK mặc định ưu tiên bảo toàn lịch sử và chặn xóa cứng khi còn liên kết.
- Rủi ro chính nằm ở contract review text, toàn vẹn quan hệ payment, CHECK gói thành viên và quy trình
  nâng cấp schema không có migration tự động.
- Schema live, hiệu lực CHECK/index thực tế và startup Hibernate vẫn là `CHỜ KIỂM CHỨNG` tại `AUD-6`.

`AUD-1` đã được tiếp nối bằng `AUD-2`; kết quả Backend nằm tại Mục 13.

## 13. Kết quả AUD-2 — Backend audit

Ngày thực hiện: **12/11/2026**  
Phương thức: **read-only static audit**  
Trạng thái: **ĐÃ AUDIT**

### 13.1. Phạm vi và giới hạn

Đã đọc và đối chiếu:

- `SecurityConfig`, JWT provider/filter, `UserDetailsService`, BCrypt và luồng reset mật khẩu;
- 17 controller, contract request/response, validation, HTTP status và exception mapping;
- service mượn–trả, đặt giữ, gói thành viên, đánh giá, wishlist, tiền phạt và payOS;
- transaction boundary, pessimistic lock, lock order, idempotency và repository query chính;
- upload/đọc ảnh bìa, cấu hình CORS, email và bí mật môi trường;
- 61 file test Java, cấu hình Surefire, hai profile MySQL và 12 file Postman hiện có.

Giới hạn của kết quả:

- Chỉ đánh giá working tree hiện tại; không suy diễn từ kết quả test lịch sử.
- Không chạy Maven test/build, không startup Backend, không gọi API, không kết nối MySQL/payOS/mail.
- Vì vậy các mục dưới đây là kết luận tĩnh có bằng chứng source; hiệu lực runtime chờ `AUD-6`.
- Không sửa source, test, cấu hình hay Database trong `AUD-2`.

### 13.2. Các kiểm soát Backend đang làm tốt

| Nhóm | Bằng chứng tĩnh | Đánh giá |
|---|---|---|
| JWT và quyền | API mặc định yêu cầu xác thực; endpoint ADMIN/USER quan trọng có matcher riêng; JWT filter tải lại user/role từ Database thay vì tin role cũ trong token. | Nền phân quyền tốt; thay đổi role có hiệu lực ở request kế tiếp. |
| Mật khẩu | Mật khẩu được BCrypt trước khi lưu; trường password không được serialize đọc ra. | Phù hợp V1. |
| Reset mật khẩu | Token có thời hạn, khóa hàng khi dùng và được đánh dấu đã sử dụng. | Có kiểm soát replay/concurrency. |
| Mượn–trả | Service dùng transaction `READ_COMMITTED`, pessimistic lock và kiểm tra idempotent khi check-in. | Giảm race tồn kho và trả sách hai lần. |
| Đặt giữ | Luồng mutation khóa user rồi book; queue và lifecycle dùng khóa book/reservation. | Lock order đã được chú thích và tương đối nhất quán. |
| Tiền phạt | Phạt được tạo trong transaction check-in; Database có unique loan–fine type. | Hạn chế tạo trùng khi retry. |
| payOS | Xác minh chữ ký webhook, tra cứu lại payment link, đối chiếu order/amount/currency/receipt, khóa khi settlement và kiểm tra ownership. | Không tin redirect trình duyệt; nền idempotency tốt. |
| Ảnh bìa | Kiểm tra dung lượng, magic bytes, decoder, kích thước/pixel và tên file UUID. | Chống giả MIME, traversal và ảnh quá lớn ở mức ứng dụng. |
| Test | Có test security, transaction rollback, concurrency, check-in, fine, reservation và payOS. | Core nghiệp vụ có nền test đáng kể dù chưa được chạy trong audit. |

### 13.3. Ma trận quyền quan trọng

| Nhóm endpoint | Quyền hiện tại | Đánh giá tĩnh |
|---|---|---|
| `POST /api/payments/webhook/payos` | Public, sau đó xác minh webhook/payOS | Hợp lý cho callback bên ngoài. |
| `GET /api/book-covers/**` | Public | Hợp lý cho ảnh catalog. |
| Catalog sách/thể loại/review công khai | Public theo matcher GET/POST search | Hợp lý; xem thêm `AUD2-BE-07`. |
| `/api/users/list` | Chỉ ADMIN | Khớp quyết định đã chốt. |
| ADMIN subscription/review/book-loan/reservation | Chỉ ADMIN | Có matcher rõ. |
| USER gửi yêu cầu trả | Chỉ ROLE_USER | Khớp trả sách hai bước. |
| ADMIN check-in | Chỉ ADMIN | Khớp nghiệp vụ kiểm tra tình trạng sách. |
| `POST /api/fines` | Deny all | Khớp quyết định V1: phạt chỉ phát sinh qua check-in. |
| `/api/subscriptions/activate` | Deny all | Chặn kích hoạt gói legacy không qua thanh toán xác minh. |
| API còn lại dưới `/api/**` | Authenticated | Có lớp bảo vệ mặc định. |

Không phát hiện endpoint mutation quan trọng nào bị public qua cấu hình hiện tại. Việc tắt CSRF phù hợp với API
stateless dùng bearer JWT; tuy nhiên CORS còn nợ cấu hình môi trường ở `AUD2-BE-08`.

### 13.4. Phát hiện P2

#### `AUD2-BE-01` — P2 — Lỗi nghiệp vụ thông thường có thể rơi thành HTTP 500 và response không đồng nhất

- `GlobalException` chỉ ánh xạ một số exception chuyên biệt như validation, user, genre, book và upload.
- `SubscriptionPlanServiceImpl`, `WishlistServiceImpl` và một số service khác vẫn ném `Exception` chung cho
  các trường hợp dự kiến như không tìm thấy, trùng mã hoặc wishlist đã tồn tại.
- Controller tiếp tục khai báo `throws Exception`; không có global mapping tương ứng để chuyển thành response
  4xx theo một contract thống nhất.
- **Ảnh hưởng:** lỗi do dữ liệu người dùng có thể bị trả như lỗi máy chủ, Frontend khó hiển thị đúng thông báo và
  log vận hành bị nhiễu.
- **Hướng sau audit:** thay exception chung bằng exception nghiệp vụ có status/code ổn định và bổ sung test contract.

#### `AUD2-BE-02` — P2 — Đăng nhập sai có contract khác nhau và làm lộ việc email có tồn tại

- `AuthServiceImpl.authenticate()` gọi thẳng `loadUserByUsername()`.
- Email không tồn tại ném `UsernameNotFoundException` chứa chính email; exception này chưa được global handler xử lý.
- Email tồn tại nhưng sai mật khẩu lại ném `UserException("Mật khẩu không chính xác.")`, được trả theo contract khác.
- **Ảnh hưởng:** cùng là thông tin đăng nhập không hợp lệ nhưng có thể khác status/body, vừa dễ thành 500 vừa cho
  phép suy đoán tài khoản tồn tại.
- **Hướng sau audit:** chuẩn hóa một lỗi xác thực chung, cùng HTTP status và thông báo không tiết lộ email tồn tại.

#### `AUD2-BE-03` — P2 — Điều kiện được đánh giá sách chỉ công nhận trạng thái `RETURNED`

- `BookReviewServiceImpl.hasUserReadBook()` chỉ gọi repository với `BookLoanStatus.RETURNED`.
- Các trạng thái check-in cuối `DAMAGED` và `LOST` không bao giờ thỏa điều kiện này.
- **Ảnh hưởng:** người đã mượn/đọc sách nhưng ADMIN kết thúc lượt mượn là hư hỏng hoặc mất sẽ không đủ điều kiện
  từ chính lịch sử đó; chưa có nhánh kiểm tra khoản phạt đã thanh toán.
- **Cần chốt tại AUD-4:** hư hỏng có được đánh giá ngay không; mất sách có chỉ được đánh giá sau khi trả phạt không.

#### `AUD2-BE-04` — P2 — Vòng đời xóa gói thành viên chưa khớp quyết định mới nhất

- Service hiện xóa cứng gói chưa có lịch sử; nếu đã có lịch sử thì đặt `isActive=false`.
- Controller và test cùng trả thông điệp “chỉ được ngừng bán”.
- Quyết định mới hơn của chủ dự án là giao diện/nghiệp vụ chỉ còn **Sửa** hoặc **Xóa**, không còn “ngừng bán”.
- FK bảo toàn lịch sử hiện cũng ngăn xóa cứng gói đã được tham chiếu.
- **Kết luận:** đây là xung đột yêu cầu xuyên tầng, không nên sửa riêng Backend trước khi chốt cách bảo toàn lịch sử
  ở `AUD-4`.

#### `AUD2-BE-05` — P2 — Validation phân trang và trường sắp xếp chưa đồng đều

- Catalog sách giới hạn `size` nhưng không chặn `page < 0` và cho client truyền tùy ý `sortBy` vào `Sort.by()`.
- Tìm kiếm lượt mượn ADMIN chỉ kiểm tra field khác null; `page` âm và thuộc tính sort không tồn tại có thể đi vào
  Spring Data rồi phát sinh exception.
- Lịch sử mượn USER kiểm tra page/size tối thiểu nhưng không giới hạn size tối đa.
- Wishlist đưa page/size trực tiếp vào `PageRequest.of()` mà không validation/cap.
- **Ảnh hưởng:** request xấu có thể thành 500 hoặc tạo response quá lớn; contract giữa các API không nhất quán.
- **Hướng sau audit:** dùng allowlist sort, `page >= 0`, `1 <= size <= 100` và lỗi 400 thống nhất.

#### `AUD2-BE-06` — P2 — Đơn payOS đã hủy/thất bại có thể khóa khả năng tạo đơn thay thế

- Store gói và tiền phạt luôn lấy payment payOS gần nhất theo đối tượng, không lọc trạng thái.
- Nếu đã có payment, service luôn đối soát lại đơn cũ và không tạo đơn mới.
- Confirmation chỉ quyết toán khi gateway là `PAID`; trạng thái không phải PAID chỉ return/throw, không ánh xạ
  `CANCELLED` hoặc `FAILED` vào payment nội bộ.
- **Ảnh hưởng:** người dùng hủy link hoặc link thất bại/hết khả dụng có thể bị giữ ở payment cũ và không thanh toán lại.
- **Lưu ý:** không được tạo đơn thay thế khi trạng thái còn không chắc chắn là đúng; `AUD-4` cần tách rõ
  `PENDING/PROCESSING` với trạng thái cuối `CANCELLED/FAILED` rồi mới thiết kế retry an toàn.

### 13.5. Phát hiện P3

#### `AUD2-BE-07` — P3 — Query parameter `activeOnly` của catalog là tham số chết

- `BookController.searchBooks()` nhận `activeOnly` nhưng không gán vào `BookSearchRequest`.
- Request model chỉ có trường `active`; public repository hiện luôn lọc sách active nên chưa làm lộ sách ẩn.
- **Ảnh hưởng:** API công bố một tham số không có tác dụng, dễ làm Frontend/Postman hiểu sai contract.

#### `AUD2-BE-08` — P3 — CORS gắn cứng vào source

- Allowed origins hiện chỉ có `http://localhost:5173` và `https://library.com` trong `SecurityConfig`.
- **Ảnh hưởng:** đổi domain/staging cần sửa và build lại source; dễ lỗi CORS khi triển khai.
- **Hướng sau audit:** đưa danh sách origin sang biến môi trường có default localhost an toàn.

#### `AUD2-BE-09` — P3 — Ảnh bìa tải lên nhưng bỏ dở form có thể thành file mồ côi

- Upload ghi file UUID xuống đĩa ngay và trả URL độc lập với transaction tạo/cập nhật sách.
- Storage service chỉ có `store()` và `load()`, chưa có cleanup/delete hoặc liên kết ownership tạm thời.
- **Ảnh hưởng:** ADMIN tải ảnh rồi đóng form, thay ảnh hoặc lưu sách thất bại sẽ để file không còn bản ghi sử dụng.

#### `AUD2-BE-10` — P3 — Batch hết hạn đặt giữ chạy toàn vòng lặp trong một transaction

- `ReservationLifecycleService` đặt `@Transactional` ở cấp class.
- `expireAvailableReservations()` lặp nhiều batch, khóa book và reservation cho đến khi toàn method hoàn tất.
- **Ảnh hưởng:** backlog lớn có thể giữ transaction/lock lâu. Đây là rủi ro hiệu năng–concurrency, chưa phải sự cố
  runtime đã được chứng minh.

#### `AUD2-BE-11` — P3 — Độ phủ contract/integration còn thiếu ở đúng các nhánh rủi ro

- Có 61 file test Java, nhưng Surefire mặc định loại toàn bộ `*IT.java`.
- Profile `mysql-contract` chỉ include 5 IT; `mysql-e2e` chỉ include 3 IT và đều chưa chạy trong audit.
- 12 file Postman hiện có chỉ bao phủ một phần so với 76 operation Backend đã kiểm kê ở `AUD-0`.
- Không tìm thấy test mục tiêu cho: unknown-user login response, exception chung wishlist/gói, sort field bất hợp lệ
  của catalog/loan, quyền review với DAMAGED/LOST và retry payment payOS ở trạng thái cuối.
- Đây là khoảng trống kiểm chứng; việc test có pass hay fail chỉ được kết luận sau `AUD-6`.

### 13.6. Liên kết với phát hiện Database và quyết định nghiệp vụ

- `AUD1-DB-01` về `review_text` vẫn có thể bị lách bằng zero-width character; Backend hiện chỉ `trim()` và pad
  ký tự zero-width. Không tạo mã mới để tránh đếm trùng phát hiện.
- `AUD1-DB-02`/`AUD1-DB-03` về payment target cần được xét cùng retry/idempotency payOS ở `AUD2-BE-06`.
- Quy tắc xóa gói ở `AUD2-BE-04` phải được giải quyết cùng FK/lịch sử subscription, không sửa riêng UI.
- Quyền đánh giá sau `RETURNED/DAMAGED/LOST` ở `AUD2-BE-03` là quyết định Business Logic của `AUD-4`.

### 13.7. Kết luận AUD-2

- Không phát hiện `P0` hoặc `P1` từ audit tĩnh Backend.
- Ghi nhận `6` phát hiện `P2` và `5` phát hiện `P3`; chưa sửa mục nào.
- Nền security/JWT, transaction/lock, check-in và xác minh payOS nhìn chung tốt hơn mức CRUD cơ bản.
- Rủi ro ưu tiên là contract lỗi HTTP, login invalid credentials, review terminal states, lifecycle gói,
  validation pagination/sort và retry đơn payOS cuối vòng đời.
- Build/test/startup, hiệu lực security runtime, MySQL integration và API response thực tế vẫn là
  `CHỜ KIỂM CHỨNG` tại `AUD-6`.

`AUD-2` đã được tiếp nối bằng `AUD-3`; kết quả Frontend nằm tại Mục 14.

## 14. Kết quả AUD-3 — Frontend audit

Ngày thực hiện: **12/11/2026**  
Phương thức: **read-only static audit**  
Trạng thái: **ĐÃ AUDIT**

### 14.1. Phạm vi và giới hạn

Đã đọc và đối chiếu:

- cấu trúc route Public/Auth/USER/ADMIN, `RequireRole`, redirect và trạng thái xác thực;
- API client, token store, request/response mapping và toàn bộ endpoint literal với controller Backend;
- các trang USER về catalog, chi tiết sách, mượn–trả, đặt giữ, wishlist, đánh giá, gói, tiền phạt và payOS;
- các trang ADMIN về người dùng, sách/thể loại, mượn–trả, đặt giữ, đánh giá, gói, tiền phạt và thanh toán;
- loading/empty/error state, `AbortController`, đồng bộ sau mutation và các loader phân trang;
- cài đặt người dùng, thông báo, privacy, theme và 26 file test Frontend hiện có.

Giới hạn của kết quả:

- Chỉ đánh giá working tree hiện tại; không sử dụng kết quả build/test lịch sử làm bằng chứng mới.
- Không chạy `npm run lint`, `npm test`, `npm run build`, Vite, trình duyệt hoặc E2E; các kiểm chứng đó thuộc `AUD-6`.
- Không sửa source, test hoặc cấu hình Frontend trong `AUD-3`.
- Các xung đột nghiệp vụ đã có mã ở AUD-1/AUD-2 được liên kết lại, không tạo mã trùng.

### 14.2. Kiểm soát Frontend đang làm tốt

| Nhóm | Bằng chứng tĩnh | Đánh giá |
|---|---|---|
| Route và quyền | Route Public tách riêng; `/user` yêu cầu USER/ADMIN theo chủ đích; `/admin` yêu cầu ADMIN; `RequireRole` chờ kiểm tra phiên, giữ return path và chuyển sai quyền sang `/403`. | Không thấy route ADMIN bị mở công khai. |
| API client | Bearer token, FormData, JSON, lỗi tiếng Việt, xử lý 401/403 và network error được tập trung tại một client. | Nền contract thống nhất, giảm lặp. |
| Hợp đồng endpoint | Đối chiếu endpoint literal Frontend với mapping Backend hiện tại không phát hiện URL hoặc HTTP method bị thiếu/lệch. | Contract tĩnh nhìn chung đồng bộ. |
| Trạng thái bất đồng bộ | Phần lớn trang tải dữ liệu dùng `AbortController`; mutation quan trọng có busy/error state và tải lại dữ liệu sau thành công. | Giảm set-state sau unmount và bấm lặp. |
| payOS | Trang thanh toán kiểm tra order/snapshot, chỉ poll đơn chưa kết thúc, không tin redirect và chỉ giữ QR trong session. | Khớp nguyên tắc xác minh Backend. |
| Đặt giữ | UI kiểm tra gói active và hướng sang mua gói; Backend vẫn là nơi cưỡng chế cuối cùng. | Phản hồi sớm nhưng không thay thế security. |
| Demo/preview | Route demo dùng dữ liệu preview và ẩn các thao tác ghi. | Không trộn dữ liệu giả với mutation thật. |
| Liên hệ | Form công khai giải thích rõ dùng `mailto:` khi chưa có mailbox Backend, không giả vờ gửi thành công qua máy chủ. | Minh bạch với người dùng. |

### 14.3. Phát hiện P2

#### `AUD3-FE-01` — P2 — Mất phiên hợp lệ khi API hồ sơ lỗi tạm thời

- `frontend/library-frontend/src/auth/AuthProvider.jsx:62-78` gọi `/api/users/profile` khi khởi động nếu có JWT.
- Nhánh `catch` gọi `signOut()` với mọi lỗi không phải abort, gồm mất mạng (`status=0`) và lỗi Backend 5xx.
- Luồng `authenticate()` ở dòng 80-92 cũng xóa token nếu bước tải profile sau login gặp lỗi tạm thời.
- **Ảnh hưởng:** một lần Backend chập chờn có thể xóa phiên/token còn hợp lệ và đẩy người dùng về đăng nhập.
- **Hướng sau audit:** chỉ xóa phiên khi có bằng chứng xác thực hết hiệu lực (đặc biệt 401); lỗi network/5xx cần giữ token và cho phép thử lại.

#### `AUD3-FE-02` — P2 — Các công tắc thông báo không điều khiển hành vi hệ thống

- `UserSettingsPage.jsx:177-296` mô tả email nhắc hạn, thông báo đặt giữ, cảnh báo quá hạn/phạt và newsletter.
- `settings/userSettings.js:66-100` chỉ lưu các giá trị này trong `localStorage`.
- Không có consumer nào dùng bốn giá trị notification để gửi email hoặc bật/tắt thông báo; `UserLayout/Navbar.jsx:87-155` vẫn poll khoản phạt mỗi 30 giây độc lập với cài đặt.
- **Ảnh hưởng:** UI báo đã lưu nhưng lựa chọn không làm thay đổi chức năng mà người dùng được hứa hẹn.
- **Hướng sau audit:** hoặc triển khai contract Backend/worker thật, hoặc đổi copy/phạm vi và chỉ hiển thị cài đặt đã có tác dụng.

#### `AUD3-FE-03` — P2 — “Đánh giá ẩn danh” chỉ ẩn trên trình duyệt của chính người viết

- `UserSettingsPage.jsx:321-334` hứa tên sẽ hiển thị là “Độc giả ẩn danh” trong đánh giá cộng đồng.
- Giá trị chỉ lưu cục bộ; request tạo review không mang thuộc tính ẩn danh và Backend không lưu chính sách này.
- `BookReviewsSection.jsx:522-534` chỉ áp dụng ẩn danh khi `isMe`, tức người viết tự thấy tên mình bị che; người dùng khác vẫn nhận và hiển thị `review.userName`.
- **Ảnh hưởng:** đây là sai lệch quyền riêng tư có thể làm người dùng công khai danh tính trái kỳ vọng.
- **Hướng sau audit:** cần thuộc tính/contract ẩn danh ở Backend và response công khai phải che tên tại nguồn; nếu V1 chưa hỗ trợ thì bỏ lựa chọn và lời hứa này.

#### `AUD3-FE-04` — P2 — Trang chi tiết có thể giữ dữ liệu cuốn sách trước khi request mới thất bại

- `BookDetailPage.jsx:52-95` dùng `Promise.allSettled()` nhưng chỉ thay reviews/loans/reservations khi từng request thành công; không reset state khi `id` đổi.
- `PublicBookDetailPage.jsx:78-139` không xóa reviews cũ khi request reviews của sách mới lỗi; dòng 142-170 có hành vi tương tự với lịch sử USER.
- `BookReviewsSection.jsx:62-99` cũng không bật lại loading hoặc xóa reviews/loans khi `bookId` đổi.
- **Ảnh hưởng:** khi điều hướng giữa hai sách mà request phụ lỗi, UI có thể hiển thị review, rating hoặc điều kiện thao tác của sách trước.
- **Hướng sau audit:** reset state theo khóa `bookId`, đặt loading lại trước fetch và gắn dữ liệu với request/key đang hoạt động.

#### `AUD3-FE-05` — P2 — Trạng thái thao tác và thống kê chi tiết sách chỉ dựa trên trang dữ liệu đầu

- `BookDetailPage.jsx:55-59` chỉ lấy tối đa 100 review, 50 lượt mượn và 50 lượt đặt giữ.
- Rating/count ở dòng 116-121 được tính từ mảng review trang đầu, không phải tổng dữ liệu Backend.
- Active loan/reservation cũng tìm trong 50 bản ghi đầu; người dùng có lịch sử dài có thể bị UI nhận định sai rồi hiển thị thao tác không phù hợp, dù Backend vẫn có thể chặn mutation.
- **Ảnh hưởng:** số liệu và khả năng hành động có thể sai khi dữ liệu tăng; lỗi thường xuất hiện muộn và khó nhận biết.
- **Hướng sau audit:** dùng summary/eligibility endpoint hoặc truy vấn có filter đúng đối tượng thay vì suy ra từ một trang lịch sử tổng quát.

### 14.4. Phát hiện P3

#### `AUD3-FE-06` — P3 — Test Frontend chưa render component, route hoặc form thật

- `package.json` chạy `node --test tests/*.test.mjs`; hiện có 26 file test.
- Không có Testing Library, jsdom, React test renderer, Playwright hoặc Puppeteer trong dependency/test imports.
- Test chủ yếu kiểm tra pure helper/API factory; chưa mount route guard, MUI form/modal, async state, focus hoặc accessibility.
- **Ảnh hưởng:** các lỗi như stale state, wiring route và tương tác form có thể không bị phát hiện dù unit helper pass.
- **Hướng sau audit:** bổ sung tầng component/integration tối thiểu và một ít E2E cho luồng trọng yếu; chỉ chạy sau khi duyệt `AUD-6`.

#### `AUD3-FE-07` — P3 — Nhiều màn hình tải toàn bộ collection tuần tự rồi phân trang ở client

- `api/loans.js`, `reviews.js`, `reservations.js` và `wishlist.js` lặp qua toàn bộ `totalPages`.
- `BookReviewsSection` tải toàn bộ review và lịch sử mượn; `adminUsers.js:31-86` lấy toàn bộ người dùng rồi filter/paginate tại trình duyệt.
- **Ảnh hưởng:** số request, thời gian chờ và bộ nhớ tăng tuyến tính theo dữ liệu; trang ADMIN/USER sẽ chậm khi hệ thống lớn dần.
- **Hướng sau audit:** giữ phân trang/filter ở Backend và chỉ tải dữ liệu cần cho trang hoặc điều kiện hiện tại.

#### `AUD3-FE-08` — P3 — Mô hình theme/settings còn phân mảnh và có cấu hình không hoạt động

- `settings/AppThemeProvider.jsx:6-12` gắn cứng `mode = "light"`.
- `settings/userSettings.js:9-21` vẫn giữ `appearance.theme` và localization; BookPage chỉ dùng một phần appearance.
- Nhiều component tự viết màu light/dark song song thay vì dựa hoàn toàn vào token theme.
- **Ảnh hưởng:** cài đặt cũ/dữ liệu lưu không phản ánh giao diện và việc khôi phục dark mode sau này dễ tạo lỗi không nhất quán.
- **Hướng sau audit:** hoặc loại bỏ state không hỗ trợ, hoặc thiết kế một nguồn theme duy nhất trước khi mở lại lựa chọn giao diện.

#### `AUD3-FE-09` — P3 — Hai trang chi tiết sách triển khai trùng logic và đã bắt đầu lệch hành vi

- Chi tiết sách tồn tại ở cả `pages/library/Book/BookDetailPage.jsx` và `pages/public/PublicBooks/PublicBookDetailPage.jsx`.
- Hai trang tự tải book/review/loan/reservation, tự tính rating/action và xử lý lỗi khác nhau; một trang tải toàn bộ review, trang kia chỉ lấy 100 review.
- **Ảnh hưởng:** sửa bug hoặc thay contract dễ chỉ cập nhật một phía; chênh lệch hiện tại ở reset state và thống kê là bằng chứng drift.
- **Hướng sau audit:** tách hook/data model và khối trình bày dùng chung, chỉ giữ khác biệt về layout/quyền thao tác.

### 14.5. Liên kết với phát hiện trước và quyết định AUD-4

- `reviewRules.js:15-25` chỉ cho đánh giá khi có loan `RETURNED`, khớp `AUD2-BE-03`; quyền với `DAMAGED/LOST` phải chốt xuyên tầng ở `AUD-4`, không tính lại thành phát hiện Frontend.
- `AdminSubscriptionsPage.jsx:531-560,1042-1050` vẫn có filter “đang/tạm ngừng bán” và copy “xóa hoặc ngừng bán”, khớp xung đột vòng đời gói ở `AUD2-BE-04`.
- `reviewRules.js:1-13` pad nội dung ngắn bằng zero-width để vượt minimum Database, đã được ghi tại `AUD1-DB-01`.
- UI vẫn có checkout trực tiếp và ADMIN “cấp sách”; quan hệ với queue đặt giữ là quyết định nghiệp vụ cần truy vết tại `AUD-4`.

### 14.6. Kết luận AUD-3

- Không phát hiện `P0` hoặc `P1` từ audit tĩnh Frontend.
- Ghi nhận `5` phát hiện `P2` và `4` phát hiện `P3`; chưa sửa mục nào.
- Route guard, API client, endpoint contract, payOS và nền xử lý async nhìn chung có cấu trúc tốt.
- Rủi ro ưu tiên là mất phiên khi lỗi tạm thời, cài đặt thông báo/ẩn danh không có hiệu lực thật, stale state theo `bookId` và suy luận trạng thái từ trang dữ liệu đầu.
- Lint/test/build, render thực tế, responsive, accessibility runtime và browser E2E vẫn `CHỜ KIỂM CHỨNG` tại `AUD-6`.

Giai đoạn tiếp theo: `AUD-4 — Business Logic audit`, tiếp tục chỉ đọc và không sửa code.

## 15. Kết quả AUD-4 — Business Logic audit

Ngày thực hiện: **12/11/2026**  
Phương thức: **read-only traceability audit**  
Trạng thái: **ĐÃ AUDIT TĨNH**; test/runtime vẫn **CHỜ AUD-6**

### 15.1. Phạm vi và cách đánh giá

Đã truy vết 24 nghiệp vụ trong Mục 6 theo chuỗi:

`Spec -> UI/Route -> API -> Controller/Security -> Service/Transaction -> Repository/MySQL -> Test -> UI feedback`.

Nguồn được đối chiếu gồm đặc tả canonical, `fix-returnbook.md`, `fix-new.md`, `PAYOS.md`, schema
`library_db1.sql`, controller/service/repository/entity hiện tại, các trang/API adapter Frontend và inventory
test Backend/Frontend. Kết quả không kế thừa trạng thái “pass” trong tài liệu lịch sử nếu chưa chạy lại.

Không chạy Maven/npm, không startup, không gọi localhost/payOS/SMTP, không kết nối MySQL và không sửa code,
cấu hình hoặc Database. Dấu `◇` trong ma trận chỉ xác nhận **có test tĩnh liên quan**, không xác nhận test pass.

### 15.2. Kết quả tổng quan

| Nhóm kết quả | Số nghiệp vụ | Mã |
|---|---:|---|
| Khớp tĩnh, chờ kiểm chứng AUD-6 | 11 | `BL-01`, `03`, `04`, `10`–`14`, `16`, `17`, `23` |
| Có phát hiện đã được định danh | 7 | `BL-02`, `05`, `18`–`21`, `24` |
| Lệch tài liệu canonical | 3 | `BL-07`, `08`, `09` |
| Cần chủ dự án chốt chính sách | 3 | `BL-06`, `15`, `22` |

Một nghiệp vụ có thể xuất hiện ở hơn một nhóm nguyên nhân khi cùng chịu ảnh hưởng của tài liệu và quyết định
chưa chốt. Không phát hiện `P0` hoặc `P1` mới từ truy vết tĩnh. Phần lớn lõi mượn–trả, đặt giữ, tiền phạt và
settlement payOS đã có transaction/lock/idempotency hợp lý; rủi ro hiện tập trung ở contract, vòng đời cuối và
phản hồi giao diện.

### 15.3. Các chuỗi nghiệp vụ đang khớp tốt khi đọc tĩnh

#### Tài khoản và phân quyền

- Đăng ký tạo tài khoản local `ROLE_USER`; đăng nhập phát JWT; route ADMIN được guard ở UI và SecurityConfig.
- Quên mật khẩu không công khai email có tồn tại; reset dùng token có hạn và mật khẩu mới.
- Profile/list user trả DTO, không đưa password hash ra response; `/api/users/list` chỉ dành cho ADMIN.
- Các test tương ứng tồn tại trong `LocalAuthenticationFlowTests`, `JwtSecurityTests`,
  `AdminUsersHttpSecurityTests` và `Step6ApiMySqlIT`, nhưng chưa chạy trong audit.

#### Mượn–trả, gia hạn và tiền phạt

- Checkout khóa user và sách, kiểm tra gói active, hạn mức sách/ngày, tồn kho, lượt mượn trùng và quá hạn.
- Gia hạn khóa lượt mượn, chặn quá hạn/yêu cầu trả, giới hạn số lần và mỗi lần tối đa
  `min(14, maxDaysPerBook của gói active)`.
- USER request-return không đóng lượt mượn hoặc cộng kho; ADMIN là người duy nhất check-in cuối.
- `RETURNED` cộng đúng một bản; `DAMAGED`/`LOST` không cộng kho. Retry check-in không lặp kho/fine.
- Phạt được tính trong cùng transaction check-in: quá hạn có trần giá tham chiếu, hư hỏng 25%/75%, mất
  100% + 20.000đ; unique `(book_loan_id, type)` là chốt chống trùng ở Database.
- Có test cho quyền, rollback, race, idempotency, ngày nhận, công thức fine và trạng thái cuối; chưa chạy lại.

#### Đặt giữ

- Chỉ cho đặt khi sách hết bản sẵn và USER có gói active; Backend kiểm tra lại gói khi ADMIN giao sách.
- Queue được khóa/sắp thứ tự; sách trả bình thường kích hoạt người đầu trong 72 giờ; hủy/hết hạn/fulfill đẩy
  hàng đợi tiếp; checkout thường không lấy bản đang ở trạng thái `AVAILABLE` cho người khác.
- Fulfill chỉ dành cho ADMIN và chỉ áp dụng lượt `AVAILABLE` đầu hàng, còn hạn; tạo loan và chuyển trạng thái
  trong cùng luồng có rollback test.

#### Gói, payOS, review và wishlist

- User có gói active không được mua gói khác; hủy gói thu hồi quyền ngay và cho tạo giao dịch mới.
- Backend lấy user, giá, VND và đối tượng Fine/Plan từ Database; không tin số tiền/danh tính từ Frontend.
- Return/cancel URL không quyết toán; webhook/reconcile xác minh bằng SDK và evidence đã lưu; settlement có khóa
  và idempotency cho callback lặp.
- Review áp dụng ownership, một review mỗi user/book và ADMIN chỉ ẩn; wishlist có ownership và unique user–book.

### 15.4. Phát hiện mới của AUD-4

#### `AUD4-BL-01` — P2 — Phần API trong đặc tả canonical còn mô tả hợp đồng cũ

- `docs/Library_Management_System_VI.md:712-765` dùng `dueDays`, `extendDays` và mô tả trả sách trực tiếp bằng
  `/checkin`; request hiện tại dùng `checkoutDays`, `extensionDays`, USER gọi `/{id}/return-request`, còn ADMIN
  check-in phải truyền tình trạng/biên bản phù hợp.
- `docs/Library_Management_System_VI.md:1044` vẫn công bố `POST /api/fines` tạo phạt thủ công dù
  `SecurityConfig` chủ động `denyAll`; V1 đã chốt fine chỉ sinh từ ADMIN check-in.
- `docs/Library_Management_System_VI.md:1060` còn ví dụ client gửi `transactionId`; controller hiện chỉ chấp nhận
  tham số rỗng và service từ chối receipt/reference do client cung cấp.
- **Ảnh hưởng:** người đọc/Postman mới có thể gửi payload sai, hiểu nhầm USER tự kết thúc trả sách hoặc tạo fine
  ngoài state machine; đây là lệch tài liệu, không phải bằng chứng code hiện tại thực thi sai.
- **Hướng sau audit:** cập nhật phần endpoint canonical từ controller/request DTO hiện tại và liên kết rõ sang
  state machine RB/FN; không đổi code chỉ để khớp ví dụ cũ.

### 15.5. Các phát hiện xuyên tầng đã có mã, không đếm lại

| Nghiệp vụ | Mã nguồn phát hiện | Kết luận truy vết |
|---|---|---|
| Login/JWT | `AUD2-BE-01`, `AUD2-BE-02`, `AUD3-FE-01` | Cần chuẩn hóa HTTP/error cho credential sai và không xóa token khi chỉ lỗi mạng/5xx. |
| Chi tiết sách | `AUD3-FE-04`, `AUD3-FE-05` | UI có thể giữ dữ liệu sách cũ và suy luận eligibility/thống kê từ trang đầu. |
| Xóa gói | `AUD2-BE-04` | Code/UI/test vẫn dùng “ngừng bán” khi có lịch sử, trái quyết định mới chỉ Sửa/Xóa; FK vẫn phải bảo toàn lịch sử. |
| Payment target | `AUD1-DB-02`, `AUD1-DB-03` | Schema cần contract mục tiêu payment rõ hơn và ngăn nhiều order chưa kết thúc cho cùng đối tượng. |
| Retry payOS | `AUD2-BE-06` | Order `CANCELLED/FAILED` cuối vòng đời có thể bị tái sử dụng và chặn tạo order thay thế. |
| Review | `AUD1-DB-01`, `AUD2-BE-03` | Contract nội dung review lệch; eligibility chỉ nhận `RETURNED`, chưa có chính sách `DAMAGED/LOST`. |
| Thông báo | `AUD3-FE-02` | V1 có notification tổng hợp từ API nghiệp vụ thật, nhưng các công tắc settings đang hứa chức năng không tồn tại. |
| Privacy review | `AUD3-FE-03` | “Ẩn danh” chỉ che cục bộ cho chính người viết, không che response công khai. |

### 15.6. Ba quyết định nghiệp vụ cần chốt trước khi sửa

#### `AUD4-D01` — ADMIN “Cấp sách” và đặt giữ

Hiện tài liệu, Backend, Frontend và test đều cho phép:

1. USER checkout trực tiếp khi sách còn sẵn;
2. ADMIN checkout/cấp sách trực tiếp cho USER;
3. USER/ADMIN tạo đặt giữ khi hết sách;
4. ADMIN fulfill lượt đặt giữ khi đến lượt.

Chủ dự án đã nêu ý kiến bỏ “Cấp sách” vì dễ trùng với Đặt giữ, nhưng chưa có quyết định canonical thay thế. Cần
chốt một trong hai mô hình trước khi sửa: giữ checkout ADMIN tại quầy cho sách còn sẵn, hoặc mọi lượt mượn đều
phải xuất phát từ request/đặt giữ và ADMIN chỉ xác nhận. Không nên chỉ ẩn nút vì API hiện vẫn cho phép.

#### `AUD4-D02` — Đánh giá sau `DAMAGED` và `LOST`

Hiện Backend/Frontend chỉ chấp nhận lịch sử `RETURNED`. Cần chốt rõ:

- `DAMAGED`: được đánh giá ngay sau ADMIN check-in hay chỉ sau khi thanh toán fine;
- `LOST`: không được đánh giá, được đánh giá ngay, hay chỉ sau khi fine `LOSS` đã thanh toán/miễn;
- nếu một user có nhiều lượt mượn cùng sách, chỉ cần ít nhất một lượt đủ điều kiện hay xét lượt cuối.

#### `AUD4-D03` — Khoản phạt chưa thanh toán có chặn nghiệp vụ mới không

Checkout hiện chỉ chặn lượt mượn quá hạn; không kiểm tra fine `PENDING/PARTIALLY_PAID`. Đặt giữ và gia hạn cũng
không có quy tắc chung về nợ phạt. Tài liệu nói USER phải thanh toán nhưng chưa nói rõ có khóa mượn/đặt/gia hạn
hay không. Cần chốt chính sách trước khi thêm kiểm tra, tránh tự suy diễn làm thay đổi quyền người dùng.

### 15.7. State machine đã truy vết

| Module | Chuyển trạng thái hợp lệ hiện tại | Điểm còn mở |
|---|---|---|
| Loan | `CHECKED_OUT -> OVERDUE`; USER request-return giữ trạng thái; ADMIN -> `RETURNED/DAMAGED/LOST` | Eligibility review và nợ fine. |
| Reservation | `PENDING -> AVAILABLE -> FULFILLED`; `PENDING/AVAILABLE -> CANCELLED`; `AVAILABLE -> EXPIRED` | Có giữ ADMIN checkout trực tiếp song song hay không. |
| Fine | `PENDING/PARTIALLY_PAID -> PAID` qua payOS; `PENDING/PARTIALLY_PAID -> WAIVED` bởi ADMIN | Nợ fine có khóa nghiệp vụ mới hay không. |
| Subscription | draft inactive -> active sau settlement; active -> cancelled/inactive; hết hạn -> inactive | Xóa plan có lịch sử sau quyết định bỏ “ngừng bán”. |
| Payment | `PENDING/PROCESSING -> SUCCESS`; có enum trạng thái cuối khác | Chưa ánh xạ/retry an toàn cho `FAILED/CANCELLED`. |
| Review | tạo sau loan `RETURNED`; owner sửa/xóa; ADMIN active -> hidden | `DAMAGED/LOST`, nội dung rỗng/ngắn và ẩn danh. |

### 15.8. Độ phủ kiểm thử theo nghiệp vụ

- Có test tĩnh cho cả 24 hàng ở mức Backend hoặc helper/API Frontend, nhưng chất lượng không đồng đều.
- Mạnh nhất: mượn–trả, race/rollback, đặt giữ, fine/check-in và payOS callback/settlement.
- Yếu nhất: render route/form thật, notification settings, privacy ẩn danh, review `DAMAGED/LOST`, payment retry
  sau trạng thái cuối và các quyết định D01–D03.
- `Step6ApiMySqlIT` và các `*IT` cung cấp contract rộng nhưng không thuộc bằng chứng pass hiện tại; Surefire mặc
  định loại một số integration test như đã ghi ở `AUD2-BE-11`.

### 15.9. Kết luận AUD-4

- Ma trận `BL-01`–`BL-24` đã được điền bằng bằng chứng working tree hiện tại.
- Ghi nhận `1` phát hiện P2 mới về đặc tả API canonical; các lỗi xuyên tầng khác liên kết về mã AUD-1/2/3 để
  không đếm trùng.
- Có `3` quyết định nghiệp vụ cần chủ dự án chốt trước giai đoạn sửa.
- Không có source/schema/config/data nào bị thay đổi; chỉ tài liệu tracker này được cập nhật.
- Giai đoạn tiếp theo là `AUD-5 — UI/UX audit`. Build/test/startup/E2E vẫn dành cho `AUD-6` sau khi được duyệt.

## 16. Kết quả AUD-5 — UI/UX audit

### 16.1. Phạm vi và giới hạn kiểm tra

- Đã audit tĩnh các luồng Public, Auth, USER và ADMIN trong working tree hiện tại; tập trung vào hệ thống theme,
  layout/navigation, component dùng chung, form, bảng, dialog, loading/error/empty state, responsive breakpoint,
  accessibility, keyboard/focus và nội dung tiếng Việt.
- Nguồn bằng chứng chính gồm `src/theme.js`, `src/index.css`, `src/settings/AppThemeProvider.jsx`, các layout Public,
  USER, ADMIN, các trang Auth, `components/common/*` và các trang nghiệp vụ lớn.
- Không mở trình duyệt, không chạy Lighthouse/axe, không dùng screen reader, không đo contrast thực tế và không
  kiểm thử viewport/zoom. Các kết luận cần render hoặc tương tác thật được chuyển sang `AUD-6`.
- Các vấn đề chức năng đã ghi ở `AUD3-FE-01`–`AUD3-FE-09` và quyết định nghiệp vụ `AUD4-D01`–`AUD4-D03`
  chỉ được liên kết, không đếm lại thành phát hiện UI/UX mới.

### 16.2. Điểm tốt đã xác nhận ở mức source

- Hệ thống có theme trung tâm với màu chính `#1769ff`, màu trạng thái và typography tương đối nhất quán; trạng
  thái nghiệp vụ dùng cả chữ lẫn màu thông qua `StatusChip`, không chỉ dựa vào màu sắc.
- Public, USER và ADMIN đã tách layout/navigation rõ ràng. USER và ADMIN đổi sidebar cố định sang Drawer trên màn
  hình nhỏ; vùng nội dung có `minWidth: 0`, giảm nguy cơ tràn ngang do layout.
- Các component dùng chung như `PageHeader`, `SearchFilterBar`, `StatCard`, `LoadingState`, `EmptyState` và
  `TablePaginationBar` giúp phần lớn trang có cấu trúc, loading/empty/error state và phân trang nhất quán.
- Bảng được đặt trong `TableContainer`; grid, stack, dialog và form dùng breakpoint MUI. Không phát hiện blocker
  responsive rõ ràng chỉ bằng source, nhưng vẫn cần xác minh tại 320/768/1440 px trong `AUD-6`.
- Topbar ADMIN có tooltip/nhãn cho các hành động chính; nhiều thao tác nguy hiểm đã dùng dialog xác nhận thay vì
  thực hiện ngay khi bấm.

### 16.3. Phát hiện mới

| Mã | Mức | Phạm vi | Phát hiện và bằng chứng | Ảnh hưởng | Hướng xử lý đề xuất, chưa triển khai |
|---|---|---|---|---|---|
| `AUD5-UX-01` | P2 | Auth/accessibility | Các trường đăng nhập dùng `Typography` đứng trước `TextField` nhưng không có `label`, cặp `id`/`htmlFor` hoặc `aria-label` tại `LoginPage.jsx:78-107` và `LoginPage.jsx:110-130`. Mẫu tương tự xuất hiện ở Register, Forgot Password và Reset Password. | Người dùng screen reader có thể gặp input không có accessible name trong các luồng xác thực cốt lõi; bấm vào chữ nhãn cũng không đưa focus vào trường. | Dùng `TextField label`, hoặc `InputLabel` liên kết `htmlFor`/`id`; giữ `autoComplete` hiện có và kiểm tra accessible name bằng screen reader/axe. |
| `AUD5-UX-02` | P2 | ADMIN/usability | Nhiều bộ lọc và form yêu cầu ADMIN nhập ID Database thô. Ví dụ đặt giữ dùng `ID người dùng`, `ID sách` tại `AdminReservationsPage.jsx:225-245` và form tạo dùng `User ID`/`Book ID` tại `AdminReservationsPage.jsx:642-659`; mô hình tương tự có ở mượn–trả, đánh giá, tiền phạt và gói thành viên. | ADMIN phải biết khóa nội bộ, dễ nhập sai người/sách/gói và khó vận hành khi dữ liệu tăng; thông báo validation không thay thế được việc chọn đúng đối tượng. | Thay bằng combobox/autocomplete tìm theo tên, email, ISBN/mã nghiệp vụ; payload vẫn gửi ID. Phần “Cấp sách” chỉ xử lý sau khi chốt `AUD4-D01`. |
| `AUD5-UX-03` | P3 | Keyboard/accessibility | Một số vùng có `onClick` nhưng không có role, `tabIndex` hoặc xử lý phím; ví dụ lựa chọn thể loại tại `GenreFilter.jsx:58-103`. Một số nút chỉ có icon thiếu accessible name, ví dụ nút menu mobile `Navbar.jsx:186-193` và nút đóng form sách `AdminBooksPage.jsx:195-197`; ô tìm kiếm USER chỉ có placeholder tại `Navbar.jsx:254-264`. | Người chỉ dùng bàn phím hoặc công nghệ hỗ trợ có thể không truy cập/nhận biết đầy đủ bộ lọc, menu, tìm kiếm và nút đóng dialog. | Dùng `Button`/`ListItemButton`/radio group thật; thêm `aria-label` hoặc tooltip tạo nhãn; kiểm tra thứ tự tab, Enter/Space, focus trap và focus return trong `AUD-6`. |
| `AUD5-UX-04` | P3 | Copy/consistency | Giao diện đã Việt hóa phần lớn nhưng còn trộn thuật ngữ tiếng Anh: `Dashboard` tại `adminNavigation.js:6`, `User ID`/`Book ID` tại `AdminReservationsPage.jsx:229-241` và `AdminReservationsPage.jsx:643-653`, cùng một số nhãn `Plan Code`, `Grid`, `List` ở các trang khác. | Không phá nghiệp vụ nhưng làm giao diện thiếu nhất quán với quy tắc “toàn bộ nội dung hiển thị bằng tiếng Việt”, đồng thời tăng tải nhận thức cho người dùng phổ thông. | Lập glossary ngắn và đổi thành “Tổng quan”, “Mã người dùng”, “Mã sách”, “Mã gói”, “Dạng lưới”, “Danh sách”; giữ thuật ngữ tiếng Anh chỉ trong code/API. |

### 16.4. Đánh giá theo khu vực

| Khu vực | Kết quả audit tĩnh | Việc còn phải kiểm chứng ở AUD-6 |
|---|---|---|
| Public | Bố cục và grid có breakpoint; CTA và trạng thái sách tương đối rõ; không thấy blocker tĩnh. | Menu mobile, focus order, contrast trên ảnh/hero, overflow 320 px và zoom 200%. |
| Auth | Luồng và copy dễ hiểu, có autocomplete và trạng thái lỗi; vướng `AUD5-UX-01`. | Accessible name, đọc lỗi bằng screen reader, focus sau submit lỗi và password visibility. |
| USER | Sidebar/topbar responsive, status/loading/empty state khá đầy đủ; vướng bộ lọc bàn phím và nhãn icon tại `AUD5-UX-03`. | Drawer bằng bàn phím, focus sau điều hướng/dialog, notification popover, bảng/card ở 320/768 px. |
| ADMIN | Hệ thống bảng, filter, summary card và dialog khá đồng nhất; vướng ID nội bộ `AUD5-UX-02`, accessible name và copy. | Form dài, table overflow, modal focus trap/return, thao tác chỉ bàn phím và thông báo lỗi/thành công. |
| Dùng chung | Theme token, semantic status và component state là nền tốt. Dark mode vẫn liên kết về `AUD3-FE-08`, không đếm lại. | Contrast tự động + thủ công, dark mode sau khi sửa FE-08, skip navigation và heading outline. |

### 16.5. Liên kết phát hiện đã có, không đếm trùng

- Theme tối và settings phân mảnh: `AUD3-FE-08`.
- Notification setting không có hiệu lực thật và ẩn danh review chỉ che cục bộ: `AUD3-FE-02`, `AUD3-FE-03`.
- Dữ liệu chi tiết sách stale và eligibility/stats chỉ đọc trang đầu: `AUD3-FE-04`, `AUD3-FE-05`.
- Thiếu rendered component/E2E test: `AUD3-FE-06`; đây là lý do AUD-5 không tuyên bố responsive/accessibility đã pass.
- Luồng “Cấp sách”, quyền đánh giá sau `DAMAGED/LOST` và chính sách nợ phạt phải theo `AUD4-D01`–`AUD4-D03`,
  không giải quyết bằng cách chỉ ẩn/đổi nút trên giao diện.

### 16.6. Checklist runtime chuyển sang AUD-6

1. Viewport tối thiểu 320 px, 768 px và 1440 px; zoom trình duyệt 200%.
2. Điều hướng chỉ bằng bàn phím: skip/main navigation, Drawer, filter, table action, dialog, popover và focus return.
3. Accessible name/description cho input và icon button; thông báo lỗi/success được công bố phù hợp.
4. Contrast text, icon, trạng thái disabled, focus indicator ở light/dark mode bằng công cụ và kiểm tra thủ công.
5. Heading/landmark outline, ngôn ngữ trang, thứ tự tab và nội dung thay đổi động.
6. Kiểm tra layout thực tế của bảng, form dài, modal và ngày tháng theo locale trình duyệt.

### 16.7. Kết luận AUD-5

- Không phát hiện P0/P1 mới bằng audit UI/UX tĩnh.
- Ghi nhận `2` phát hiện P2 và `2` phát hiện P3 mới; các vấn đề chức năng/nghiệp vụ đã có chỉ được liên kết để
  tránh đếm trùng.
- Nền UI hiện tại có hệ thống theme/component/responsive tương đối tốt; rủi ro chính nằm ở accessibility của Auth,
  thao tác ADMIN phụ thuộc ID kỹ thuật và một số điều khiển chưa thân thiện với bàn phím/công nghệ hỗ trợ.
- Chưa thể tuyên bố responsive, accessibility hoặc contrast đã đạt vì chưa có kiểm chứng trình duyệt/runtime.
- Không có source/schema/config/data nào bị thay đổi; chỉ tài liệu tracker này được cập nhật.
- Giai đoạn tiếp theo là `AUD-6 — Kiểm chứng kỹ thuật`, cần chủ dự án duyệt trước khi chạy lint/test/build,
  startup, browser audit hoặc E2E.

