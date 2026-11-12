# Kế hoạch sửa nghiệp vụ trả sách

Ngày lập: **09/11/2026** (Asia/Saigon)  
Trạng thái tổng thể: **RB-1–RB-6 đã triển khai; RB-7 đã đạt test tự động và đồng bộ tài liệu. Còn xác minh lần khởi động mới với `ddl-auto=validate` và nghiệm thu MySQL end-to-end trên database thử nghiệm riêng.**

## 1. Mục tiêu

Thay luồng trả sách một bước hiện tại bằng luồng hai bước phù hợp với thư viện vật lý:

1. **USER gửi yêu cầu trả sách** và chờ ADMIN tiếp nhận.
2. **ADMIN kiểm tra sách thực tế** rồi mới hoàn tất với một trong ba kết quả: bình thường, hư hỏng hoặc mất.

USER không được tự kết thúc lượt mượn, tự tăng tồn kho hoặc tự quyết định tình trạng sách. Khi có vi phạm, hệ thống tạo khoản phạt cho USER; ADMIN không phải là người thanh toán khoản phạt.

## 2. Quy tắc đã chốt

- USER chỉ được gửi yêu cầu trả cho lượt mượn của chính mình.
- Gửi yêu cầu trả **không** cập nhật `return_date`, không chuyển sang `RETURNED` và không cộng `available_copies`.
- Trong thời gian chờ, giao diện hiển thị **Chờ ADMIN xác nhận**.
- ADMIN là vai trò duy nhất được hoàn tất check-in và xác định `RETURNED`, `DAMAGED` hoặc `LOST`.
- Trả bình thường: đóng lượt mượn và cộng đúng một bản vào kho sẵn.
- Hư hỏng hoặc mất: đóng lượt mượn nhưng không đưa bản sách trở lại kho sẵn.
- Chỉ kích hoạt lượt đặt giữ tiếp theo khi sách được trả bình thường và tồn kho thực sự tăng.
- Một lượt mượn có thể đồng thời phát sinh phạt quá hạn và phạt hư hỏng/mất.
- USER thanh toán khoản phạt qua luồng thanh toán hiện có; ADMIN chỉ xác nhận vi phạm hoặc miễn phạt có lý do.
- API phải chống bấm lặp: không cộng tồn kho hoặc tạo tiền phạt trùng.

## 3. Thiết kế trạng thái đề xuất

Không thêm `RETURN_REQUESTED` vào `BookLoanStatus` ở bước đầu. Trạng thái vật lý vẫn là `CHECKED_OUT` hoặc `OVERDUE`; yêu cầu trả được theo dõi bằng dữ liệu riêng.

Lý do:

- một sách có thể vừa quá hạn vừa đang chờ ADMIN nhận;
- không làm mất ý nghĩa của `OVERDUE`;
- các quy tắc tồn kho và lịch sử trả vẫn dựa trên trạng thái cuối cùng hiện có.

Các cột dự kiến sẽ được xem xét ở RB-1 trước khi ALTER:

| Cột | Mục đích |
| --- | --- |
| `return_requested_at` | Thời điểm USER gửi yêu cầu trả |
| `return_request_note` | Ghi chú của USER khi gửi yêu cầu, nếu có |
| `checked_in_at` | Thời điểm ADMIN hoàn tất tiếp nhận/kiểm tra |
| `checked_in_by` | ADMIN đã xác nhận tình trạng sách |
| `inspection_note` | Mô tả tình trạng hư hỏng, mất hoặc ghi chú tiếp nhận |

Đây mới là đề xuất schema, chưa phải ALTER đã được thực thi. Dự án tiếp tục dùng duy nhất `database/library_db1.sql`; không dùng Flyway hoặc Liquibase.

## 4. Luồng mục tiêu

| Bước | Chủ thể | Kết quả |
| --- | --- | --- |
| 1 | USER | Bấm **Gửi yêu cầu trả sách** |
| 2 | Backend | Kiểm tra quyền sở hữu và lượt mượn còn hiệu lực; ghi nhận yêu cầu |
| 3 | Hệ thống | Giữ nguyên tồn kho, ngày trả và trạng thái mượn thực tế |
| 4 | ADMIN | Mở danh sách **Chờ xác nhận trả** và nhận sách tại quầy |
| 5A | ADMIN | Chọn **Bình thường** → `RETURNED`, cộng tồn kho một lần |
| 5B | ADMIN | Chọn **Hư hỏng** → `DAMAGED`, không cộng tồn kho, tạo phạt theo chính sách |
| 5C | ADMIN | Chọn **Mất sách** → `LOST`, không cộng tồn kho, tạo phạt theo chính sách |
| 6 | Backend | Tính và tạo thêm phạt quá hạn nếu có; không tạo trùng |
| 7 | USER | Xem khoản phạt và thanh toán qua payOS |

## 5. API mục tiêu

### USER

- Thêm `POST /api/book-loans/{id}/return-request`.
- Chỉ chủ lượt mượn được gọi.
- Gọi lặp khi đang chờ phải trả về kết quả idempotent hoặc lỗi nghiệp vụ rõ ràng, không ghi trùng.
- Không cho gia hạn khi yêu cầu trả đang chờ xử lý.

### ADMIN

- Giữ hoặc chuẩn hóa endpoint check-in cuối cùng, nhưng bắt buộc `ROLE_ADMIN`.
- Endpoint nhận tình trạng `RETURNED`, `DAMAGED` hoặc `LOST`, ngày nhận thực tế và ghi chú kiểm tra.
- API tìm kiếm ADMIN hỗ trợ lọc các lượt có `return_requested_at IS NOT NULL` nhưng chưa check-in.

### Quy tắc bảo mật

- USER không còn được gọi API check-in cuối cùng.
- Backend phải kiểm tra quyền; không dựa vào việc Frontend ẩn nút.
- ADMIN check-in, cập nhật tồn kho và tạo phạt phải nằm trong cùng transaction.

## 6. Chính sách tiền phạt V1 đã chốt

Giá dùng để tính phạt là `books.price` tại thời điểm ADMIN xác nhận. Nếu sách chưa có giá hoặc giá không dương, hệ thống dùng mức tham chiếu `100.000đ` nhưng ADMIN phải xem và xác nhận trước khi tạo phạt.

1. **Quá hạn (`OVERDUE`):** `min(số ngày trễ × 5.000đ, giá tham chiếu của sách)`.
2. **Hư hỏng nhẹ (`DAMAGE/LIGHT`):** `25%` giá tham chiếu của sách.
3. **Hư hỏng nặng (`DAMAGE/SEVERE`):** `75%` giá tham chiếu của sách.
4. **Mất sách (`LOSS`):** `100%` giá tham chiếu của sách `+ 20.000đ` phí xử lý.

Quy tắc áp dụng:

- số ngày trễ tính từ ngày sau `dueDate` đến ngày thư viện thực tế nhận sách;
- ADMIN được nhập ngày nhận thực tế để USER không bị tính thêm ngày trễ do ADMIN xử lý chậm;
- số tiền phần trăm được làm tròn đến đơn vị VND;
- ADMIN phải chọn rõ mức hư hỏng nhẹ hoặc nặng và nhập mô tả kiểm tra;
- `DAMAGE` và `LOSS` loại trừ nhau trên cùng lượt mượn;
- `OVERDUE` có thể tồn tại cùng `DAMAGE` hoặc `LOSS`;
- mỗi loại phạt chỉ được tạo tối đa một lần cho cùng một lượt mượn;
- khoản `20.000đ` phí xử lý được gộp vào fine `LOSS`, không tạo fine `PROCESSING` riêng;
- Backend tính lại số tiền từ dữ liệu tin cậy; không nhận số tiền do USER gửi lên làm nguồn sự thật;
- ADMIN được xem số tiền dự kiến trước khi xác nhận, sau đó hệ thống tạo fine ở trạng thái `PENDING` để USER thanh toán qua payOS.

## 7. Lộ trình triển khai

### RB-0 — Chốt hiện trạng và phạm vi

Trạng thái: **Hoàn tất ngày 09/11/2026**

- [x] Xác nhận USER hiện gọi trực tiếp API check-in cuối cùng.
- [x] Xác nhận Backend lập tức ghi ngày trả, đổi trạng thái và cộng tồn kho.
- [x] Xác nhận USER và ADMIN đang dùng chung `/api/book-loans/checkin`.
- [x] Xác nhận ADMIN đã có UI chọn bình thường, mất hoặc hư hỏng.
- [x] Xác nhận tiền phạt hiện chưa tự sinh khi check-in.
- [x] Chốt chuyển sang luồng USER yêu cầu → ADMIN kiểm tra → hệ thống hoàn tất.

### RB-1 — Chốt quy tắc và ALTER Database

Trạng thái: **Đã hoàn tất đồng bộ schema và backup MySQL live ngày 10/11/2026; việc xác minh Backend với `ddl-auto=validate` được theo dõi ở RB-7**

- [x] Kiểm tra dữ liệu live liên quan đến lượt mượn và tiền phạt.
- [x] Chốt danh sách cột tối thiểu cần bổ sung.
- [x] Chốt công thức và thời điểm tính phạt.
- [x] Trình bày ALTER cụ thể, tác động dữ liệu và phương án khôi phục trước khi chạy.
- [x] Đã được đồng ý và đã cập nhật schema nguồn `database/library_db1.sql`.
- [x] Sao lưu toàn bộ MySQL live trước khi ALTER vào `database/backups/`.
- [x] Áp dụng metadata trả sách, index hàng chờ, FK/CHECK và unique fine lên MySQL live.
- [x] Kiểm tra lại schema live, số dòng và tính nhất quán sau ALTER.
- [x] Chuyển xác minh khởi động `ddl-auto=validate` sang nghiệm thu runtime RB-7.

### RB-2 — Backend yêu cầu trả sách

Trạng thái: **Hoàn tất code và test ngày 10/11/2026**

- [x] Thêm request/response và service gửi yêu cầu trả.
- [x] Kiểm tra quyền sở hữu, trạng thái đang mượn/quá hạn và yêu cầu đang chờ.
- [x] Không thay đổi `return_date`, trạng thái cuối hoặc tồn kho.
- [x] Chặn gia hạn trong thời gian chờ.
- [x] Bổ sung truy vấn ADMIN cho danh sách chờ xác nhận.
- [x] Viết test quyền, idempotency và bất biến tồn kho.

### RB-3 — Backend ADMIN check-in và phân quyền

Trạng thái: **Hoàn tất code và test ngày 10/11/2026**

- [x] Giới hạn check-in cuối cùng cho `ROLE_ADMIN`.
- [x] Ghi ADMIN xác nhận, thời điểm nhận và ghi chú kiểm tra.
- [x] `RETURNED` cộng tồn kho đúng một lần.
- [x] `DAMAGED` và `LOST` không cộng tồn kho.
- [x] Chỉ kích hoạt hàng đợi đặt giữ khi có bản sách trở lại kho.
- [x] Chống retry gây tăng tồn kho lần hai.
- [x] Viết test phân quyền và ba kết quả check-in.

### RB-4 — Tạo tiền phạt trong nghiệp vụ trả sách

Trạng thái: **Đã hoàn tất code và test ngày 10/11/2026**

- [x] Tính số ngày quá hạn đến ngày nhận thực tế.
- [x] Tạo `OVERDUE` khi có số ngày trễ và số tiền hợp lệ.
- [x] Tạo `DAMAGE` hoặc `LOSS` theo lựa chọn của ADMIN.
- [x] Cho phép đồng thời `OVERDUE` và `DAMAGE`/`LOSS`.
- [x] Không tạo khoản phạt trùng khi API bị gọi lại.
- [x] Check-in và tạo phạt rollback cùng nhau nếu có lỗi.
- [x] Giữ nguyên luồng USER thanh toán phạt qua payOS.

### RB-5 — Frontend USER

Trạng thái: **Đã triển khai và nghiệm thu test/build Frontend ở RB-7**

- [x] Đổi nút thành **Gửi yêu cầu trả sách** và gửi qua `POST /api/book-loans/{id}/return-request`.
- [x] Nội dung xác nhận nói rõ đây chỉ là yêu cầu; lượt mượn và tồn kho chưa đổi cho đến khi ADMIN tiếp nhận.
- [x] Hiển thị trạng thái chờ ADMIN, thời điểm gửi và ghi chú người dùng.
- [x] Ẩn gia hạn và nút gửi lặp khi yêu cầu đang chờ.
- [x] Luồng USER trong `MyLoans` không gọi `/api/book-loans/checkin`.
- [x] Hiển thị trạng thái cuối, ngày ADMIN tiếp nhận, ghi chú kiểm tra và fine gắn với lượt mượn; có liên kết sang trang tiền phạt để thanh toán.

### RB-6 — Frontend ADMIN

Trạng thái: **Đã triển khai và nghiệm thu test/build Frontend ở RB-7**

- [x] Thêm tab **Chờ xác nhận trả** lấy dữ liệu từ API hàng chờ ADMIN.
- [x] Hiển thị người mượn, sách, hạn trả, thời điểm yêu cầu, ghi chú và số ngày quá hạn.
- [x] Form tiếp nhận cho phép chọn bình thường, hư hỏng nhẹ/nặng hoặc mất.
- [x] Bắt buộc mô tả khi hư hỏng/mất và chọn rõ ngày nhận thực tế.
- [x] Tải giá sách và hiển thị các khoản phạt dự kiến trước khi xác nhận.
- [x] Yêu cầu ADMIN xác nhận giá mặc định 100.000đ nếu sách chưa có giá hợp lệ.
- [x] Sau thành công, tải lại danh sách đang mở và số đếm các tab.

### RB-7 — Nghiệm thu và đồng bộ tài liệu

Trạng thái: **Đạt kiểm thử tự động và đồng bộ tài liệu ngày 10/11/2026; còn xác nhận startup `ddl-auto=validate` sau đồng bộ schema và MySQL end-to-end với dữ liệu thử cô lập.**

- [x] Backend unit/service/security test đạt: `mvnw.cmd test` — 199 test, 0 failure, 0 error, 0 skipped.
- [x] Frontend API/component test đạt: 104 test, 0 failure.
- [x] Maven test và Frontend production build đạt.
- [ ] Xác nhận lần khởi động Backend mới sau khi đồng bộ schema RB-1, với `spring.jpa.hibernate.ddl-auto=validate`.
- [ ] MySQL end-to-end với dữ liệu thử có kiểm soát: chưa chạy. Test Failsafe yêu cầu một database riêng tên kết thúc `_test`; không được chạy fixture lên `library_db1`.
- [x] Cập nhật `docs/Library_Management_System_VI.md` theo luồng mới.
- [x] Cập nhật tài liệu BE-1 để phân biệt mốc lịch sử và nghiệp vụ hiện hành.
- [x] Ghi kết quả nghiệm thu và giới hạn còn lại vào file này.

## 8. Tiêu chí nghiệm thu cuối

Luồng chỉ được xem là hoàn tất khi tất cả điều kiện sau đạt:

- USER gửi yêu cầu nhưng lượt mượn chưa bị đóng và tồn kho không đổi.
- USER không thể gọi API check-in cuối cùng, kể cả gọi trực tiếp ngoài Frontend.
- ADMIN nhìn thấy hàng chờ và xác nhận được ba tình trạng sách.
- Trả bình thường cộng tồn kho chính xác một lần.
- Mất/hư hỏng không cộng tồn kho.
- Quá hạn và mất/hư hỏng có thể tạo các khoản phạt độc lập, đúng số tiền và không trùng.
- Lỗi khi tạo phạt không để lượt mượn, tồn kho và khoản phạt ở trạng thái dở dang.
- USER xem và thanh toán được khoản phạt bằng luồng payOS hiện có.
- Schema live, `library_db1.sql`, Java enum/model, Frontend và tài liệu khớp nhau.

## 9. Phạm vi chưa làm trong tài liệu này

- Luồng sửa chữa sách hư hỏng để đưa trở lại kho.
- Quản lý từng bản sao sách bằng mã barcode riêng.
- Hoàn tiền hoặc tranh chấp khoản phạt.
- Thay đổi cơ chế thanh toán payOS.
- Flyway hoặc Liquibase.

## 10. Nhật ký tiến độ

| Ngày | Giai đoạn | Kết quả |
| --- | --- | --- |
| 09/11/2026 | RB-0 | Review code/schema/UI, chốt luồng trả sách hai bước và tạo tài liệu theo dõi |
| 09/11/2026 | RB-1 | Chốt thiết kế schema và ALTER đề xuất; MySQL `127.0.0.1:3306` chưa mở nên chưa audit hoặc thay đổi Database live |
| 09/11/2026 | RB-1 | Chốt mức phạt: quá hạn 5.000đ/ngày có mức trần; hư hỏng nhẹ 25%, nặng 75%; mất 100% giá sách + 20.000đ |
| 09/11/2026 | RB-1 | Audit read-only trên MySQL live đạt: 2 lượt mượn đều `RETURNED`, không có trạng thái/ngày trả bất nhất, không có fine hoặc fine trùng; 6/57 sách thiếu giá hợp lệ; chưa chạy ALTER |
| 10/11/2026 | RB-1 | Người dùng phê duyệt thay đổi schema nhưng yêu cầu chưa áp dụng MySQL live; đã đồng bộ 5 cột metadata, index hàng chờ, FK/CHECK và unique fine vào `database/library_db1.sql` |
| 10/11/2026 | RB-2 | Hoàn tất API USER gửi yêu cầu trả, hàng chờ ADMIN, khóa gia hạn, mapping metadata và kiểm thử quyền/idempotency/tồn kho; lúc hoàn tất phần code, schema live chưa được áp dụng (đã đồng bộ sau đó) |
| 10/11/2026 | RB-3 | Khóa check-in cuối cùng cho ADMIN, ghi ngày nhận/người kiểm tra/biên bản, xử lý `RETURNED`/`DAMAGED`/`LOST`, bảo vệ tồn kho và hàng đợi đặt giữ bằng transaction cùng khóa bi quan |
| 10/11/2026 | RB-4 | Tự động tạo fine quá hạn/hư hỏng/mất khi ADMIN check-in; áp dụng mức trần, giá tham chiếu có xác nhận, chống trùng và rollback nguyên tử |
| 10/11/2026 | RB-5 | Nối USER với API yêu cầu trả, trạng thái chờ ADMIN, ghi chú tùy chọn, khóa gia hạn và hiển thị kết quả/fine; chưa chạy build/test |
| 10/11/2026 | RB-6 | Nối tab hàng chờ trả, form kiểm tra sách, ngày nhận thực tế, mức độ hư hỏng và xem trước tiền phạt vào Frontend ADMIN; chưa chạy build/test |
| 10/11/2026 | RB-1 | Sao lưu `library_db1` rồi áp dụng RB-1 lên MySQL 9.2; xác minh 5 cột, index, FK/CHECK, unique fine; 2 lượt mượn vẫn nhất quán, không có fine trùng |
| 10/11/2026 | RB-7 | Backend 199/199 test; Frontend 104/104 test và production build đạt; Backend local phản hồi HTTP (GET `/api/books` 403 khi chưa xác thực); đồng bộ tài liệu. MySQL E2E chưa chạy vì chưa cấu hình DB thử nghiệm `_test`; `library_db1` không bị ghi trong giai đoạn nghiệm thu này |

## 11. Kết quả thiết kế RB-1

### 11.1. Kết quả audit trước ALTER ngày 09/11/2026

Các ghi nhận thiếu cột/index dưới đây là ảnh chụp schema **trước khi** áp dụng ALTER ngày
10/11/2026. Trạng thái sau ALTER được ghi tại Mục 11.10.

- `database/library_db1.sql` hiện chưa có dữ liệu theo dõi yêu cầu trả hoặc ADMIN tiếp nhận.
- `book_loans.status` hiện chỉ nhận `CHECKED_OUT`, `RETURNED`, `OVERDUE`, `LOST`, `DAMAGED`; danh sách này tiếp tục được giữ nguyên.
- `fines` đã hỗ trợ `OVERDUE`, `DAMAGE`, `LOSS`, phù hợp để một lượt mượn có nhiều loại phạt khác nhau.
- `books.price` là nullable, vì vậy không được tự động tạo phạt mất sách chỉ dựa vào giá sách nếu giá đang thiếu.
- Chưa có unique constraint ngăn hai khoản phạt cùng loại cho một lượt mượn.
- MySQL `127.0.0.1:3306` và Backend `127.0.0.1:8000` đang hoạt động; Frontend `5173` chưa chạy nhưng không ảnh hưởng audit RB-1.
- Audit được chạy trực tiếp trong MySQL Workbench bằng session `READ ONLY` và kết thúc bằng `ROLLBACK`; không có dữ liệu nào bị thay đổi.
- Kết quả live: `total_loans = 2`, `RETURNED = 2`, `CHECKED_OUT = 0`, `OVERDUE = 0`, `LOST = 0`, `DAMAGED = 0`.
- `inconsistent_final_loans = 0`, đạt điều kiện dữ liệu lượt mượn để đi tiếp.
- `total_fines = 0` và `duplicate_fine_groups = 0`, đạt điều kiện bổ sung unique constraint theo đề xuất.
- Có `57` sách, trong đó `6` sách có `price IS NULL` hoặc `price <= 0`; luồng tạo phạt phải bắt buộc ADMIN xác nhận mức tham chiếu `100.000đ` cho các sách này.
- Tại thời điểm audit trước ALTER, năm cột metadata trả sách và unique index fine đều chưa tồn tại (`0`), vì vậy không có xung đột tên schema.
- Schema nguồn `database/library_db1.sql` đã được cập nhật ngày 10/11/2026; MySQL live được đồng bộ cùng ngày, xem kết quả tại Mục 11.10.

### 11.2. Schema tối thiểu đã chọn

Không thêm `RETURN_REQUESTED` vào CHECK status. Bổ sung năm cột vào `book_loans`:

| Cột | Kiểu | Quy tắc |
| --- | --- | --- |
| `return_requested_at` | `DATETIME NULL` | USER đã gửi yêu cầu trả; null nếu chưa gửi hoặc ADMIN nhận trực tiếp tại quầy |
| `return_request_note` | `VARCHAR(500) NULL` | Ghi chú riêng của USER, không trộn với ghi chú kiểm tra |
| `checked_in_at` | `DATETIME NULL` | Thời điểm ADMIN hoàn tất tiếp nhận |
| `checked_in_by` | `BIGINT NULL` | FK đến ADMIN trong `users`; nullable để tương thích lịch sử cũ |
| `inspection_note` | `VARCHAR(500) NULL` | Ghi chú kiểm tra tình trạng thực tế |

Thêm index hàng chờ:

```sql
INDEX idx_book_loans_return_queue
    (checked_in_at, return_requested_at, id)
```

Index này phục vụ truy vấn `checked_in_at IS NULL` và sắp xếp theo thời điểm USER yêu cầu. Không thay thế các index mượn/trả hiện có.

### 11.3. Quy tắc ngày đã chốt

- `return_requested_at` chỉ là thời điểm khai báo, không phải ngày thư viện đã nhận sách.
- ADMIN nhập **ngày nhận thực tế**, mặc định là ngày hiện tại tại `Asia/Ho_Chi_Minh`.
- Ngày nhận không được trước `checkout_date` hoặc ở tương lai.
- Số ngày quá hạn được tính đến ngày nhận thực tế do ADMIN xác nhận.
- `return_date` chỉ được ghi khi ADMIN hoàn tất check-in.
- `checked_in_at` là dấu thời gian hệ thống khi thao tác ADMIN được commit.
- ADMIN có thể check-in trực tiếp tại quầy dù USER chưa gửi yêu cầu; khi đó `return_requested_at` được phép null.

### 11.4. Quy tắc tiền phạt đã chốt

- `OVERDUE`: Backend tính `min(overdueDays × 5.000đ, referencePrice)`.
- `DAMAGE/LIGHT`: Backend tính `25% × referencePrice`.
- `DAMAGE/SEVERE`: Backend tính `75% × referencePrice`.
- `LOSS`: Backend tính `100% × referencePrice + 20.000đ` phí xử lý.
- `referencePrice` lấy từ `books.price` nếu dương; nếu thiếu/null/0 thì dùng mức tham chiếu `100.000đ` và bắt buộc ADMIN xác nhận.
- Số tiền phần trăm được làm tròn đến đơn vị VND.
- `DAMAGE` và `LOSS` không được cùng tồn tại trên một lượt mượn; `OVERDUE` có thể đi cùng một trong hai loại này.
- Mỗi loại `OVERDUE`, `DAMAGE`, `LOSS` chỉ được tạo tối đa một lần trên cùng lượt mượn.
- Khoản phạt được tạo ở trạng thái `PENDING`; USER thanh toán qua payOS hiện có.
- Giá phạt phải là số nguyên VND dương. Không lấy số tiền do USER gửi lên làm nguồn sự thật.
- Các hằng số `5.000đ`, `25%`, `75%`, `20.000đ` và giá tham chiếu `100.000đ` sẽ nằm trong cấu hình Backend, không tạo bảng cấu hình mới ở RB-1.

### 11.5. Truy vấn audit bắt buộc trước ALTER

Chỉ chạy khi MySQL đã mở. Các truy vấn này là read-only:

```sql
USE library_db1;

SELECT status, COUNT(*) AS total
FROM book_loans
GROUP BY status
ORDER BY status;

SELECT COUNT(*) AS inconsistent_final_loans
FROM book_loans
WHERE (status IN ('RETURNED', 'LOST', 'DAMAGED') AND return_date IS NULL)
   OR (status IN ('CHECKED_OUT', 'OVERDUE') AND return_date IS NOT NULL);

SELECT book_loan_id, type, COUNT(*) AS duplicate_count
FROM fines
GROUP BY book_loan_id, type
HAVING COUNT(*) > 1;

SELECT
    COUNT(*) AS total_books,
    SUM(price IS NULL OR price <= 0) AS books_without_usable_price
FROM books;
```

Điều kiện đi tiếp:

- `inconsistent_final_loans = 0`;
- truy vấn duplicate fine không trả dòng nào;
- số sách thiếu giá chỉ được dùng để quyết định bắt buộc ADMIN nhập phạt mất sách, không phải lý do xóa hoặc tự sửa giá.

### 11.6. ALTER tham chiếu cho MySQL live — đã áp dụng

Các thay đổi tương ứng đã được đưa trực tiếp vào các lệnh `CREATE TABLE` của
`database/library_db1.sql`. Hai câu lệnh ALTER dưới đây đã được chạy trên MySQL live
ngày 10/11/2026 sau khi audit, kiểm tra điều kiện dữ liệu và tạo backup. Đây vẫn là
tham chiếu để nâng cấp một bản `library_db1` cũ; không chạy lại trên DB đã đồng bộ.

ALTER thứ nhất bổ sung metadata trả sách:

```sql
ALTER TABLE book_loans
    ADD COLUMN return_requested_at DATETIME NULL AFTER return_date,
    ADD COLUMN return_request_note VARCHAR(500) NULL AFTER return_requested_at,
    ADD COLUMN checked_in_at DATETIME NULL AFTER return_request_note,
    ADD COLUMN checked_in_by BIGINT NULL AFTER checked_in_at,
    ADD COLUMN inspection_note VARCHAR(500) NULL AFTER checked_in_by,
    ADD INDEX idx_book_loans_return_queue
        (checked_in_at, return_requested_at, id),
    ADD CONSTRAINT fk_book_loans_checked_in_by
        FOREIGN KEY (checked_in_by) REFERENCES users(id),
    ADD CONSTRAINT chk_book_loans_return_request_time
        CHECK (
            return_requested_at IS NULL
            OR return_requested_at >= checkout_date
        ),
    ADD CONSTRAINT chk_book_loans_checkin_time
        CHECK (
            checked_in_at IS NULL
            OR (
                status IN ('RETURNED', 'LOST', 'DAMAGED')
                AND return_date IS NOT NULL
                AND (
                    return_requested_at IS NULL
                    OR checked_in_at >= return_requested_at
                )
            )
        );
```

ALTER thứ hai chỉ được chạy khi truy vấn duplicate fine không trả dòng nào:

```sql
ALTER TABLE fines
    ADD CONSTRAINT uq_fines_book_loan_type
        UNIQUE (book_loan_id, type);
```

Hai ALTER được tách vì unique constraint của `fines` có cổng dữ liệu riêng. MySQL DDL có implicit commit; không dựa vào transaction rollback cho ALTER.

### 11.7. Tác động tương thích

- Các cột mới đều nullable nên không bắt buộc sửa hoặc suy đoán dữ liệu lịch sử.
- `checked_in_by` nullable giữ được các lượt đã trả trước khi hệ thống lưu ADMIN xác nhận.
- Không thay đổi `BookLoanStatus`, `FineType` hoặc dữ liệu payment/payOS.
- Hibernate `ddl-auto=validate` thường chấp nhận cột dư nullable, nên Backend cũ có thể vẫn khởi động sau ALTER. Tuy nhiên luồng mới chỉ hoạt động khi entity/DTO/repository được bổ sung mapping ở RB-2/RB-3; schema và code vẫn phải được nghiệm thu cùng một đợt.
- Unique fine có thể làm lộ caller đang cố tạo cùng loại phạt lần hai; Backend phải chuyển lỗi constraint thành thông báo nghiệp vụ và kiểm tra idempotency trước khi lưu.

### 11.8. Phương án khôi phục schema

Chỉ dùng khi chưa có code mới phụ thuộc các cột và đã sao lưu Database:

```sql
ALTER TABLE fines
    DROP INDEX uq_fines_book_loan_type;

ALTER TABLE book_loans
    DROP CHECK chk_book_loans_checkin_time,
    DROP CHECK chk_book_loans_return_request_time,
    DROP FOREIGN KEY fk_book_loans_checked_in_by,
    DROP INDEX idx_book_loans_return_queue,
    DROP COLUMN inspection_note,
    DROP COLUMN checked_in_by,
    DROP COLUMN checked_in_at,
    DROP COLUMN return_request_note,
    DROP COLUMN return_requested_at;
```

Rollback này xóa metadata mới nên chỉ thực hiện sau khi xác nhận không có dữ liệu yêu cầu trả/check-in mới cần giữ. Trước ALTER phải tạo backup có thể phục hồi trong `database/backups/`; backup không được nhập vào file schema chính.

### 11.9. Điều kiện để kết thúc RB-1

RB-1 chỉ chuyển sang **Hoàn tất** sau khi:

1. [x] MySQL `library_db1` hoạt động và các truy vấn audit đạt.
2. [x] Người dùng đồng ý thay đổi schema tại Mục 11.6.
3. [x] Ngày 10/11/2026, `database/library_db1.sql` và MySQL live đã đồng bộ; backup được giữ trong `database/backups/`.

Phần RB-1 về schema đã hoàn tất. Backend khởi động với `spring.jpa.hibernate.ddl-auto=validate`
được kiểm tra cùng nghiệm thu runtime RB-7, không phải điều kiện để chạy lại ALTER.

### 11.10. Kết quả đồng bộ MySQL live ngày 10/11/2026

- Đích đã kiểm tra: schema `library_db1`, MySQL Server `9.2.0`; phiên audit xác nhận `read_only=1`.
- Audit trước ALTER: `book_loans` có 2 dòng, cả 2 `RETURNED`; không có lượt mượn sai cặp trạng thái/ngày trả; `fines` có 0 dòng và không có nhóm phạt trùng.
- Backup toàn database thành công: [`library_db1_before_RB1_20261110_131832.sql`](../database/backups/library_db1_before_RB1_20261110_131832.sql), kích thước 59.980 byte.
- Đã thêm vào `book_loans`: `return_requested_at`, `return_request_note`, `checked_in_at`, `checked_in_by`, `inspection_note`; index `idx_book_loans_return_queue`; FK `fk_book_loans_checked_in_by`; CHECK `chk_book_loans_return_request_time` và `chk_book_loans_checkin_time`.
- Đã thêm unique constraint `uq_fines_book_loan_type` trên `(book_loan_id, type)` sau khi xác nhận bảng `fines` không có dữ liệu trùng.
- Audit sau ALTER xác nhận đủ 5 cột, đủ index/constraint; dữ liệu vẫn có 2 lượt mượn (đều đã trả), 0 fine, 0 lượt bất nhất và 0 nhóm fine trùng.
- Chưa khởi động Backend để xác nhận Hibernate `ddl-auto=validate`; việc kiểm tra runtime vẫn thuộc RB-7.

## 12. Kết quả triển khai RB-2

### 12.1. API và dữ liệu

- USER gửi yêu cầu qua `POST /api/book-loans/{id}/return-request` với body dạng `{"note":"..."}`; trường `note` có thể để trống.
- Chỉ tài khoản `ROLE_USER` sở hữu lượt mượn mới được gửi yêu cầu.
- Chỉ chấp nhận lượt có trạng thái `CHECKED_OUT` hoặc `OVERDUE`.
- Lần gửi đầu ghi `return_requested_at` và `return_request_note`; lần gửi lặp trả lại dữ liệu đầu tiên, không ghi đè.
- Response `BookLoanDTO` đã có `returnRequestedAt`, `returnRequestNote`, `returnPending`, `checkedInAt`, `checkedInById` và `inspectionNote`.
- Trong RB-2, API không ghi `return_date`, không đổi trạng thái và không cập nhật `available_copies`.
- Khi `returnPending = true`, API gia hạn từ chối với thông báo nghiệp vụ tiếng Việt.

### 12.2. Hàng chờ ADMIN

- ADMIN đọc hàng chờ qua `GET /api/book-loans/admin/return-requests?page=0&size=20`.
- Repository chỉ lấy lượt còn hoạt động có `return_requested_at IS NOT NULL` và `checked_in_at IS NULL`.
- Hàng chờ được sắp xếp theo thời điểm yêu cầu tăng dần, sau đó theo ID.
- USER không được truy cập endpoint hàng chờ; ADMIN không được giả lập thao tác gửi yêu cầu của USER.

### 12.3. Kết quả kiểm thử

- Test service RB-2: quyền sở hữu, trạng thái hợp lệ, ghi chú, bấm lặp, chặn gia hạn và truy vấn ADMIN đều đạt.
- Test HTTP security xác nhận đúng ranh giới `ROLE_USER`/`ROLE_ADMIN` cho hai endpoint mới.
- Test H2 đồng thời xác nhận hai yêu cầu trả chạy cùng lúc vẫn chỉ có một metadata yêu cầu, tồn kho không tăng, trạng thái vẫn `CHECKED_OUT` và `return_date` vẫn null.
- Toàn bộ Backend đạt **183 test**, không có failure, error hoặc test bị bỏ qua.

### 12.4. Giới hạn runtime hiện tại

Tại thời điểm ghi nhận RB-2, MySQL live đã được ALTER theo RB-1 và xác minh đủ schema cần thiết.
Backend chưa được khởi động lại để xác nhận `spring.jpa.hibernate.ddl-auto=validate`; kiểm tra đó
được để lại cho RB-7. Tình hình nghiệm thu hiện tại xem tại Mục 17.

## 13. Kết quả triển khai RB-3

### 13.1. API check-in cuối cùng

- Giữ endpoint `POST /api/book-loans/checkin` để không phá hợp đồng API hiện có, nhưng cả
  `SecurityConfig` và service đều bắt buộc `ROLE_ADMIN`.
- Request nhận `bookLoanId`, `condition`, `receivedDate` và `inspectionNote`.
- `receivedDate` được phép để trống để dùng ngày hiện tại, nhưng không được trước ngày mượn hoặc
  ở tương lai.
- Tên request cũ `notes` tạm thời vẫn được chấp nhận như alias của `inspectionNote`; dữ liệu mới
  được lưu vào `inspection_note`, không trộn vào ghi chú của lượt mượn.
- `inspectionNote` bắt buộc khi kết quả là `DAMAGED` hoặc `LOST` và tối đa 500 ký tự.
- ADMIN có thể tiếp nhận trực tiếp tại quầy dù USER chưa gửi yêu cầu trước đó, đúng quy tắc RB-1.

### 13.2. Tồn kho và đặt giữ

- `RETURNED`: ghi `return_date`, `checked_in_at`, `checked_in_by`, `inspection_note`; cộng đúng một
  bản vào `available_copies` và chỉ sau đó mới kích hoạt lượt đặt giữ tiếp theo.
- `DAMAGED` hoặc `LOST`: đóng lượt mượn và ghi đầy đủ metadata kiểm tra nhưng không cộng tồn kho,
  không kích hoạt đặt giữ.
- Lượt mượn và đầu sách đều được khóa bi quan; toàn bộ check-in chạy trong cùng transaction.
- Retry sau khi lần đầu đã hoàn tất trả lại kết quả hiện có, không lưu lần hai, không cộng kho hoặc
  kích hoạt hàng đợi lần hai.
- Số ngày quá hạn lịch sử được tính đến `receivedDate` và không làm giảm số ngày đã ghi nhận trước đó.

### 13.3. Kết quả kiểm thử RB-3

- Test service xác nhận ranh giới quyền ADMIN, ba kết quả check-in, yêu cầu biên bản cho sách
  hư hỏng/mất và kiểm tra ngày nhận.
- Test HTTP xác nhận USER nhận `403` và ADMIN gọi được `/api/book-loans/checkin`.
- Test H2 đồng thời xác nhận hai request check-in cùng lúc đều nhận kết quả idempotent nhưng kho
  chỉ tăng đúng một bản.
- Bộ test trọng tâm RB-3 đạt **26 test**, không có failure, error hoặc test bị bỏ qua.
- Toàn bộ Backend đạt **192 test**, không có failure, error hoặc test bị bỏ qua.

### 13.4. Phạm vi đã chuyển sang RB-4

RB-3 ghi nhận kết quả kiểm tra vật lý. RB-4 đã bổ sung công thức và tạo fine `OVERDUE`,
`DAMAGE`, `LOSS` trong cùng transaction check-in.

## 14. Kết quả triển khai RB-4

### 14.1. Dữ liệu ADMIN gửi khi check-in

Endpoint tiếp tục dùng `POST /api/book-loans/checkin`. Backend không nhận số tiền phạt từ client.

- `condition = RETURNED`: không gửi `damageLevel`.
- `condition = DAMAGED`: bắt buộc gửi `damageLevel = LIGHT` hoặc `SEVERE` và `inspectionNote`.
- `condition = LOST`: không gửi `damageLevel`, nhưng bắt buộc có `inspectionNote`.
- `receivedDate` để trống thì dùng ngày hiện tại; số ngày quá hạn được tính đến ngày này.
- Nếu `books.price` null, bằng 0 hoặc âm và giao dịch có phát sinh phạt, ADMIN phải gửi
  `confirmDefaultReferencePrice = true` để xác nhận dùng giá tham chiếu `100.000đ`.

Ví dụ hư hỏng nhẹ:

```json
{
  "bookLoanId": 11,
  "condition": "DAMAGED",
  "damageLevel": "LIGHT",
  "receivedDate": "2026-11-10",
  "inspectionNote": "Rách nhẹ hai trang, sách vẫn có thể lưu hành",
  "confirmDefaultReferencePrice": false
}
```

### 14.2. Fine được tạo tự động

- `OVERDUE`: `min(số ngày trễ × 5.000đ, giá tham chiếu)`.
- `DAMAGE/LIGHT`: `25% × giá tham chiếu`, làm tròn đến VND.
- `DAMAGE/SEVERE`: `75% × giá tham chiếu`, làm tròn đến VND.
- `LOSS`: `giá tham chiếu + 20.000đ` phí xử lý.
- Fine mới có trạng thái `PENDING`, `amountPaid = 0`, liên kết với lượt mượn và USER,
  đồng thời ghi ADMIN vào `processed_by`.
- Một lượt có thể đồng thời có `OVERDUE` và một trong `DAMAGE` hoặc `LOSS`.
- Không tạo fine `PROCESSING` riêng; phí xử lý đã gộp vào `LOSS`.

### 14.3. An toàn giao dịch và chống trùng

- Lượt mượn được khóa bi quan trước khi check-in nên hai request đồng thời được tuần tự hóa.
- Backend kiểm tra `(book_loan_id, type)` trước khi tạo; unique constraint
  `uq_fines_book_loan_type` trong schema là lớp bảo vệ cuối cùng.
- Retry sau khi check-in hoàn tất chỉ trả lại kết quả hiện có, không tạo fine hoặc cập nhật kho lần hai.
- Check-in, cập nhật tồn kho và tạo tất cả fine cùng một transaction. Test H2 xác nhận lỗi lưu fine
  sẽ rollback trạng thái, ngày trả, metadata check-in và toàn bộ fine.

### 14.4. Cấu hình và kiểm thử

Các mức phạt nằm trong `application.properties` với tiền VND và tỷ lệ thập phân:

- `app.fines.overdue-daily-rate=5000`
- `app.fines.light-damage-rate=0.25`
- `app.fines.severe-damage-rate=0.75`
- `app.fines.loss-processing-fee=20000`
- `app.fines.default-reference-price=100000`

Toàn bộ Backend đạt **199 test**, không có failure, error hoặc test bị bỏ qua. Luồng USER xem và
thanh toán fine qua payOS hiện có không bị thay đổi.

### 14.5. Phạm vi tiếp theo

RB-5 đã nối Frontend USER với yêu cầu trả. RB-6 đã nối phần ADMIN. Kết quả test/build và giới hạn
MySQL E2E được ghi tại Mục 17.

## 15. Kết quả triển khai RB-6 — Frontend ADMIN

- Tab **Chờ xác nhận trả** gọi `GET /api/book-loans/admin/return-requests`, hiển thị độc giả,
  sách, hạn trả, thời điểm yêu cầu, ghi chú và số ngày quá hạn tính đến hiện tại.
- Mở form từ hàng chờ sẽ hiển thị ghi chú yêu cầu của độc giả. ADMIN chọn `RETURNED`, `DAMAGED`
  hoặc `LOST`; hư hỏng yêu cầu chọn `LIGHT` hoặc `SEVERE`.
- Ngày nhận thực tế được gửi dưới dạng `receivedDate` và được giới hạn từ ngày mượn đến hôm nay.
- Với hư hỏng/mất, ADMIN phải ghi mô tả kiểm tra. Frontend tải giá qua API danh mục ADMIN và
  hiển thị ước tính `OVERDUE`, `DAMAGE` hoặc `LOSS` theo chính sách RB-4.
- Nếu sách không có giá hợp lệ, form yêu cầu ADMIN xác nhận dùng 100.000đ trước khi gửi. Backend
  vẫn tính lại số tiền; Frontend chỉ hiển thị dự kiến.
- Sau khi xác nhận thành công, trang tải lại hàng chờ/lượt mượn và số lượng trên các tab. Backend
  RB-4 xử lý tồn kho, đặt giữ và tạo khoản phạt trong transaction check-in.
- Đã cập nhật `src/api/adminLoans.js` và `src/pages/AdminLayout/AdminLoansPage.jsx`.
- Tại RB-7, Frontend test tổng thể đạt 104/104 và production build thành công.

## 16. Kết quả triển khai RB-5 — Frontend USER

- Trang **Sách đang mượn** gửi yêu cầu qua `POST /api/book-loans/{id}/return-request`, kèm ghi chú
  tùy chọn tối đa 500 ký tự. Sau khi gửi, giao diện tải lại lượt mượn và tiền phạt.
- Hộp xác nhận nêu rõ yêu cầu chưa hoàn tất việc trả, chưa đổi trạng thái mượn hoặc tồn kho; người
  dùng cần mang sách đến quầy để ADMIN tiếp nhận.
- Khi `returnPending = true`, thẻ sách hiện trạng thái **Chờ ADMIN xác nhận**, thời điểm gửi và ghi
  chú. Không hiện nút gửi yêu cầu lần nữa hoặc nút gia hạn.
- Sau khi ADMIN check-in, USER thấy trạng thái cuối, ngày tiếp nhận và ghi chú kiểm tra. Fine được
  tải từ `GET /api/fines/my`, ghép theo `bookLoanId`, hiển thị loại/số tiền/trạng thái và liên kết
  sang `/user/my-fines` để xem hoặc thanh toán qua payOS.
- API helper `loansApi.checkin` cũ vẫn còn để tránh làm hỏng contract hiện có; không component USER
  nào gọi helper này. ADMIN dùng `adminLoans.checkin`, còn Backend chỉ cho `ROLE_ADMIN` check-in.
- Đã cập nhật `src/api/loans.js`, `src/pages/MyLoans/MyLoans.jsx`,
  `src/pages/MyLoans/LoanCard.jsx` và `src/pages/MyLoans/loanRules.js`.
- Tại RB-7, Frontend test tổng thể đạt 104/104 và production build thành công.

## 17. Kết quả nghiệm thu RB-7 — 10/11/2026

### Đã kiểm chứng

- `Library\mvnw.cmd test`: **199 test, 0 failure, 0 error, 0 skipped; BUILD SUCCESS**. Đây là bộ
  Surefire mặc định (unit/service/security và test context); các lớp `*IT` MySQL bị loại khỏi
  Surefire theo cấu hình Maven.
- `frontend/library-frontend`: **104 test đạt** và `npm run build` thành công.
- Backend local đã trả lời HTTP. Request ẩn danh `GET /api/books` trả **403 Forbidden** đúng với
  `SecurityConfig` yêu cầu xác thực cho `/api/**`; đây là bằng chứng server HTTP phản hồi, không phải
  kết quả kiểm thử endpoint nghiệp vụ có JWT.
- Cấu hình hiện đặt `spring.jpa.hibernate.ddl-auto=validate`, nhưng chưa lấy được log hoặc bằng chứng
  lần khởi động mới sau thời điểm đồng bộ schema RB-1. Vì vậy mục runtime validate vẫn để mở.
- Theo kết quả RB-1 tại Mục 11.10, schema `library_db1` đã được backup, áp dụng và audit đủ metadata
  RB-1. Không thay đổi schema hay dữ liệu MySQL trong RB-7.

### Còn lại trước khi đóng nghiệm thu toàn luồng

- Không chạy MySQL E2E trên database chính có dữ liệu. Maven Failsafe chỉ nhận `TEST_DB_URL` trỏ
  tới database riêng có hậu tố `_test`; môi trường hiện chưa cung cấp cấu hình database thử nghiệm.
- Do thiếu database thử nghiệm cô lập, chưa tạo fixture để chạy API yêu cầu trả → ADMIN check-in →
  fine → kiểm tra đọc lại trên MySQL. Không dùng dữ liệu đang có của người dùng làm fixture.
- Kiểm tra cổng cho thấy MySQL 3306 đang mở; HTTP trên 8000 phản hồi; Frontend 5173 không mở
  trong thời điểm kiểm tra. Vì vậy không xác nhận UI end-to-end trên trình duyệt ở lượt RB-7.
- Frontend build có cảnh báo bundler về chỉ thị `"use client"` trong gói MUI; build vẫn thành công.

**Kết luận:** code và tài liệu đã được nghiệm thu bằng bộ test/build tự động. RB-7 vẫn **chưa đóng**
cho đến khi chạy MySQL E2E trên database `_test` và kiểm tra luồng bằng phiên USER/ADMIN phù hợp.

