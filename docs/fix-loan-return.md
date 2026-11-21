# Kế hoạch chuẩn hóa nghiệp vụ mượn – trả sách

> **Dành cho giai đoạn triển khai:** Thực hiện lần lượt từng giai đoạn LR bên dưới và đánh dấu checkbox để theo dõi. Chưa triển khai code khi tài liệu này chưa được duyệt.

**Mục tiêu:** Chuẩn hóa nghiệp vụ mượn – trả cho website quản lý thư viện sách Kinh Phật, loại bỏ việc tạo lượt mượn trước khi giao sách và làm rõ trách nhiệm của USER, ADMIN và hệ thống.

**Kiến trúc:** Tái sử dụng `Reservation` làm giai đoạn trước khi giao sách. Sách còn bản tạo yêu cầu ở trạng thái sẵn sàng nhận; sách hết bản tạo yêu cầu trong hàng chờ. `BookLoan` chỉ được tạo khi ADMIN xác nhận đã giao sách vật lý cho người dùng.

**Công nghệ:** Spring Boot, Spring Data JPA, MySQL, React, Vite và MUI.

**Đặc tả:** Các quyết định nghiệp vụ được chủ dự án chốt ngày 20/11/2026 và được ghi tại các phần 1–9 của tài liệu này.

## 1. Phạm vi

Tài liệu này chỉ điều chỉnh nghiệp vụ:

- Đăng ký mượn sách.
- Đặt giữ và xếp hàng chờ.
- Giao sách cho người dùng.
- Gia hạn lượt mượn.
- Yêu cầu trả và tiếp nhận sách trả.
- Cập nhật quá hạn tự động.
- Phát sinh tiền phạt khi ADMIN tiếp nhận sách.

Không thay đổi ngoài phạm vi:

- Cách quản lý sách và thể loại.
- Cách mua gói thành viên và thanh toán payOS.
- Mức phạt đã chốt.
- Quy tắc đánh giá, yêu thích và hồ sơ người dùng.
- Cấu trúc điều hướng tổng thể của website, trừ các nút và nhãn trực tiếp liên quan đến mượn – trả.

## 2. Nguyên tắc nghiệp vụ đã chốt

1. Người dùng thao tác đăng ký mượn trên website nhưng lượt mượn chưa bắt đầu ngay.
2. Ngày mượn và hạn trả chỉ bắt đầu khi ADMIN xác nhận giao sách.
3. Sách còn bản và sách hết bản dùng chung một vòng đời `Reservation` trước khi tạo `BookLoan`.
4. Không tạo thêm bảng yêu cầu mượn mới; sử dụng bảng `reservations` hiện có.
5. USER không tự tạo `BookLoan`.
6. ADMIN không tạo lượt mượn tự do bằng nút “Cấp sách”; ADMIN chỉ giao sách từ một yêu cầu hợp lệ.
7. Yêu cầu sẵn sàng nhận phải giữ một bản sách, không để người khác mượn vượt số lượng còn lại.
8. Khi yêu cầu bị hủy hoặc hết hạn nhận, bản sách được trả về kho và hệ thống xét người tiếp theo trong hàng chờ.
9. Trạng thái quá hạn được Backend cập nhật tự động; ADMIN không phải bấm “Cập nhật quá hạn”.
10. ADMIN vẫn là người xác nhận tiếp nhận sách và đánh giá tình trạng bình thường, hư hỏng hoặc mất.

## 3. Trạng thái trước khi giao sách — `ReservationStatus`

Giữ nguyên các enum hiện có và chuẩn hóa ý nghĩa như sau:

| Trạng thái | Ý nghĩa | Ai tạo/chuyển trạng thái | Hành động tiếp theo |
| --- | --- | --- | --- |
| `PENDING` | Sách chưa có bản trống; người dùng đang ở hàng chờ | Hệ thống khi USER đăng ký sách đã hết | Chờ hệ thống phân bổ bản sách |
| `AVAILABLE` | Đã giữ được một bản sách; người dùng có thể đến nhận | Hệ thống khi sách đang còn hoặc khi đến lượt trong hàng chờ | USER đến nhận, ADMIN xác nhận giao |
| `FULFILLED` | Sách đã được giao và `BookLoan` đã được tạo | ADMIN xác nhận giao sách | Theo dõi tại “Sách đang mượn” |
| `CANCELLED` | USER hoặc ADMIN hủy yêu cầu hợp lệ | USER/ADMIN | Hoàn lại bản đã giữ và xét hàng chờ |
| `EXPIRED` | USER không đến nhận trong thời hạn | Tác vụ tự động | Hoàn lại bản đã giữ và xét hàng chờ |

### Quy tắc phân bổ bản sách

- Nếu còn bản có thể phân bổ, yêu cầu mới chuyển thẳng sang `AVAILABLE`.
- Nếu không còn bản có thể phân bổ, yêu cầu mới ở `PENDING` và nhận `queuePosition`.
- Khi chuyển sang `AVAILABLE`, hệ thống giữ đúng một bản cho yêu cầu đó.
- Số yêu cầu `AVAILABLE` không được vượt số bản có thể phân bổ.
- Chuyển `AVAILABLE → FULFILLED` không được trừ kho lần thứ hai.
- Chuyển `AVAILABLE → CANCELLED/EXPIRED` phải hoàn lại đúng một bản trước khi xét người tiếp theo.
- Các bước phân bổ, hoàn kho và tạo lượt mượn phải chạy trong transaction và khóa dữ liệu sách để tránh hai người nhận cùng một bản.

## 4. Trạng thái lượt mượn thực tế — `BookLoanStatus`

`BookLoan` chỉ tồn tại sau khi ADMIN giao sách.

| Trạng thái | Ý nghĩa | Người/hệ thống thực hiện |
| --- | --- | --- |
| `CHECKED_OUT` | Sách đã được giao và đang trong hạn mượn | Tạo khi ADMIN xác nhận giao |
| `OVERDUE` | Sách chưa trả và ngày hiện tại đã vượt hạn trả | Backend tự động cập nhật |
| `RETURNED` | ADMIN đã nhận sách bình thường | ADMIN check-in |
| `DAMAGED` | ADMIN đã nhận và xác nhận sách hư hỏng | ADMIN check-in |
| `LOST` | ADMIN xác nhận người dùng làm mất sách | ADMIN check-in |

Yêu cầu trả không cần thêm enum mới. Lượt mượn vẫn là `CHECKED_OUT` hoặc `OVERDUE`, đồng thời lưu thông tin yêu cầu trả hiện có để ADMIN lọc nhóm “Chờ xác nhận trả”.

## 5. Hành động của USER

| Tình huống | Hành động hiển thị | Kết quả |
| --- | --- | --- |
| Chưa có gói thành viên hiệu lực | “Đăng ký gói thành viên” | Điều hướng đến trang gói |
| Sách còn bản và đủ điều kiện | “Đăng ký mượn sách” | Tạo `Reservation.AVAILABLE` và thông báo thời hạn nhận |
| Sách hết bản và đủ điều kiện | “Đặt giữ sách” | Tạo `Reservation.PENDING` và hiển thị vị trí hàng chờ |
| Đã có yêu cầu `PENDING` | “Đang trong hàng chờ” | Không cho tạo yêu cầu trùng |
| Đã có yêu cầu `AVAILABLE` | “Sẵn sàng nhận sách” | Hiển thị hạn cuối đến nhận |
| Đang mượn chính cuốn sách | “Bạn đang mượn sách này” | Không cho tạo yêu cầu mới |
| Đang mượn và đủ điều kiện gia hạn | “Gia hạn” | Gia hạn theo quy tắc đã chốt |
| Muốn trả sách | “Yêu cầu trả sách” | Đánh dấu chờ ADMIN tiếp nhận |
| Yêu cầu chưa được giao | “Hủy yêu cầu” | Hủy nếu trạng thái cho phép |

USER không được:

- Tự xác nhận đã nhận sách.
- Tự chọn ngày bắt đầu lượt mượn.
- Tự xác nhận đã trả sách.
- Tự chọn tình trạng hư hỏng hoặc mất để kết thúc lượt mượn.

## 6. Hành động của ADMIN

| Màn hình/nhóm | Hành động | Điều kiện |
| --- | --- | --- |
| Yêu cầu sẵn sàng nhận | “Xác nhận giao sách” | Reservation là `AVAILABLE`, chưa hết hạn và bản sách vẫn được giữ |
| Hàng chờ | Xem thứ tự, tìm kiếm, hủy theo nghiệp vụ | Reservation là `PENDING` |
| Chờ xác nhận trả | “Xác nhận nhận sách” | USER đã gửi yêu cầu trả |
| Chi tiết nhận sách | Chọn bình thường/hư hỏng nhẹ/hư hỏng nặng/mất | Thực hiện tại check-in |
| Lượt đang mượn | Xem chi tiết, xử lý gia hạn nếu chức năng ADMIN vẫn được giữ | Loan là `CHECKED_OUT` hoặc `OVERDUE` |
| Quá hạn | Theo dõi, liên hệ người dùng | Trạng thái do hệ thống tự cập nhật |

Thay đổi giao diện ADMIN đã chốt:

- Bỏ nút chung “Cấp sách”.
- Bỏ nút “Cập nhật quá hạn” sau khi tác vụ tự động hoạt động.
- Nút “Xác nhận giao sách” chỉ xuất hiện trên yêu cầu `AVAILABLE` cụ thể.
- Giữ thao tác “Xác nhận nhận sách” trên yêu cầu trả cụ thể.
- Khu vực đầu trang hiển thị các thẻ: Chờ giao, Đang mượn, Chờ xác nhận trả và Quá hạn.

## 7. Luồng nghiệp vụ chuẩn

### 7.1. Sách đang còn bản

```text
USER đăng ký mượn
→ kiểm tra gói, hạn mức, nợ/quá hạn và yêu cầu trùng
→ giữ một bản sách
→ Reservation = AVAILABLE
→ gửi thông báo thời hạn nhận
→ ADMIN xác nhận giao sách
→ Reservation = FULFILLED
→ tạo BookLoan = CHECKED_OUT
→ bắt đầu tính ngày mượn và hạn trả
```

### 7.2. Sách đã hết bản

```text
USER đặt giữ
→ Reservation = PENDING
→ xếp vị trí hàng chờ
→ có bản sách được trả về
→ giữ bản cho người đầu hàng chờ
→ Reservation = AVAILABLE
→ gửi thông báo thời hạn nhận
→ ADMIN xác nhận giao sách
→ Reservation = FULFILLED
→ tạo BookLoan = CHECKED_OUT
```

### 7.3. Người dùng không đến nhận

```text
Reservation = AVAILABLE
→ vượt thời hạn nhận
→ Reservation = EXPIRED
→ hoàn bản đã giữ
→ xét người tiếp theo
→ gửi thông báo cho các bên liên quan
```

### 7.4. Trả sách

```text
USER gửi yêu cầu trả
→ hiển thị trong nhóm Chờ xác nhận trả
→ ADMIN nhận và kiểm tra sách
→ RETURNED / DAMAGED / LOST
→ kết thúc lượt mượn
→ hoàn kho nếu sách còn sử dụng được
→ tự động tạo tiền phạt nếu có
→ kích hoạt người tiếp theo trong hàng chờ nếu có
```

### 7.5. Quá hạn

```text
Tác vụ Backend chạy theo lịch
→ tìm CHECKED_OUT có dueDate < ngày hiện tại
→ chuyển OVERDUE và cập nhật overdueDays
→ gửi thông báo chống trùng
→ khi check-in, tính tiền phạt theo ngày nhận thực tế
```

## 8. Hợp đồng và dữ liệu cần giữ ổn định

- `ReservationStatus` và `BookLoanStatus` hiện có đủ trạng thái, chưa cần thêm enum.
- Lịch sử `RETURNED`, `DAMAGED`, `LOST` hiện tại được giữ nguyên.
- Lượt `CHECKED_OUT` và `OVERDUE` hiện tại tiếp tục vận hành theo luồng trả sách hiện có.
- Luồng mới chỉ áp dụng cho yêu cầu mượn phát sinh sau khi triển khai.
- API USER hiện tạo trực tiếp lượt mượn không còn được Frontend sử dụng; nếu giữ tương thích tạm thời thì phải chặn USER và chỉ dùng nội bộ khi hoàn tất reservation.
- Thao tác hoàn tất reservation phải idempotent: gọi lặp không tạo hai `BookLoan`.
- Một USER không được đồng thời có yêu cầu đang hoạt động và lượt mượn đang hoạt động cho cùng một sách.
- Không làm thay đổi công thức phạt: hư hỏng nhẹ 25%, hư hỏng nặng 75%, mất sách 100% giá sách cộng 20.000đ phí xử lý; quá hạn 5.000đ/ngày và không vượt giá sách.

## 9. Thứ tự triển khai

### LR-0 — Chốt baseline và test trạng thái hiện tại

- [x] Ghi nhận schema MySQL live và số lượng bản ghi theo trạng thái (đối chiếu chỉ đọc ngày 20/11/2026; kết quả ở LR-7).
- [x] Bổ sung test để loan đã `RETURNED`/`DAMAGED`/`LOST` không bị chọn vào batch quá hạn và reservation đã `FULFILLED`/`CANCELLED`/`EXPIRED` không bị chọn vào batch hết hạn (đã viết; chờ chạy được).
- [x] Chốt baseline thời hạn nhận: 72 giờ như hằng số hiện tại trong `ReservationLifecycleService`; bộ quét hết hạn mặc định mỗi 60 giây và có thể cấu hình bằng biến môi trường.
- [x] Chốt contract chuyển tiếp: Frontend sẽ dùng `/api/reservations` làm API đăng ký mượn/đặt giữ; sau khi chuyển xong, ngừng công bố hai đường tạo loan trực tiếp `POST /api/book-loans/checkout` và `POST /api/book-loans/checkout/user/{userId}`. Việc ngừng endpoint chỉ làm ở LR-1/LR-2 sau khi khách gọi đã được chuyển, không làm ở LR-0.

**Baseline ban đầu:** `database/library_db1.sql` cho phép năm trạng thái loan (`CHECKED_OUT`, `RETURNED`, `OVERDUE`, `LOST`, `DAMAGED`) và năm trạng thái reservation (`PENDING`, `AVAILABLE`, `FULFILLED`, `CANCELLED`, `EXPIRED`). Frontend khi bắt đầu LR gọi `POST /api/book-loans/checkout`, nghĩa là Backend tạo loan và trừ kho ngay; ADMIN có thêm route tạo loan theo user ID. LR-2/LR-5 đã chuyển luồng giao diện sang reservation; hiện hai route checkout cũ trả HTTP 410.

**Trạng thái baseline:** schema và số lượng bản ghi MySQL live đã được đọc ở LR-7. Hai test bảo vệ lịch sử vẫn chưa chạy được vì Maven dừng ở lỗi biên dịch test có sẵn tại `BookCoverStorageServiceTests.java:116`: test gọi `BookCoverStorageService.deleteUnreferenced(Set<String>, Instant)` nhưng method không tồn tại. Lỗi này nằm ngoài phạm vi mượn–trả và được giữ lại làm blocker kiểm thử Backend. Không có thay đổi dữ liệu hoặc schema live nào được thực hiện trong LR-7.

```sql
SELECT DATABASE() AS active_schema, VERSION() AS mysql_version;
SHOW CREATE TABLE book_loans;
SHOW CREATE TABLE reservations;
SELECT status, COUNT(*) AS total FROM book_loans GROUP BY status ORDER BY status;
SELECT status, COUNT(*) AS total FROM reservations GROUP BY status ORDER BY status;
```

**Hoàn tất khi:** schema live và số lượng trạng thái được đối chiếu với source, hai test bảo vệ lịch sử chạy thành công, và không sửa dữ liệu lịch sử. Phần schema/baseline đã hoàn tất; kiểm thử Backend vẫn chờ xử lý blocker nêu trên.

### LR-1 — Chuẩn hóa yêu cầu mượn trên Backend

- [x] Sửa tạo reservation để sách còn bản chuyển thẳng `AVAILABLE`.
- [x] Sách hết bản tiếp tục tạo `PENDING` và xếp hàng.
- [x] Giữ bản sách an toàn khi reservation thành `AVAILABLE`.
- [x] Hoàn bản khi `AVAILABLE` bị hủy hoặc hết hạn.
- [x] Kiểm tra gói thành viên, hạn mức, sách quá hạn và yêu cầu trùng.
- [ ] Bổ sung test transaction và cạnh tranh nhiều người dùng.

**Đã sửa code; chờ USER kiểm thử/nghiệm thu.** Theo yêu cầu lần triển khai này, không viết/chạy test. Hạn mức tính cả lượt mượn đang hoạt động và yêu cầu đang hoạt động. Phân bổ theo thứ tự hàng chờ, có thể giữ nhiều bản cho nhiều yêu cầu khi kho đủ.

**Trạng thái chuyển đổi MySQL live:** đối chiếu LR-7 thấy marker `LR1_RESERVED_COPIES` đã được ghi trong `lr_schema_migrations` lúc `2026-11-20 16:16:04`. Không chạy lại script trên database này; marker ngăn áp dụng giảm tồn kho lần hai. Với database khác, chỉ dùng [`database/migrations/lr1-reservation-inventory.sql`](../database/migrations/lr1-reservation-inventory.sql) sau khi sao lưu và kiểm tra dữ liệu hiện có.

**Điều chỉnh phụ thuộc:** bước giao sách hiện tại chuyển bản đã giữ sang checkout trong cùng transaction để tổng tồn kho không bị trừ lần hai; cho phép giao bất kỳ yêu cầu `AVAILABLE` hợp lệ vì mỗi yêu cầu đã có bản riêng. Những hạng mục khác của LR-2 vẫn chờ triển khai.

**Khu vực chính:** `ReservationServiceImpl`, `ReservationLifecycleService`, repository sách/đặt giữ và các test reservation.

**Hoàn tất khi:** không thể giữ vượt số bản sách và không thể tạo yêu cầu trùng.

### LR-2 — Chuẩn hóa giao sách của ADMIN

- [x] Chỉ cho phép giao từ reservation `AVAILABLE` còn hiệu lực.
- [x] Trong một transaction, chuyển reservation sang `FULFILLED` và tạo đúng một `BookLoan`.
- [x] Ngày giao là `checkoutDate`; `dueDate` tính từ ngày giao theo hạn mức gói.
- [x] Không trừ kho lần thứ hai khi tạo loan từ bản đã giữ.
- [x] Chặn thao tác lặp và thao tác trên reservation hết hạn.
- [ ] Bổ sung test phân quyền USER/ADMIN và idempotency.

**LR-2 đã sửa code, chờ USER nghiệm thu; không chạy test/build theo yêu cầu.** ADMIN gọi lại yêu cầu `FULFILLED` nhận lại DTO hiện tại mà không tạo loan/thông báo mới. Yêu cầu không có hạn nhận hoặc đã hết hạn bị từ chối. Khi giao vẫn kiểm tra lại gói, hạn mức, quá hạn và lượt mượn trùng. Ngày mượn lấy ngày giao, số ngày mượn là `min(14, hạn mức ngày của gói)`.

**Chuyển tiếp API:** hai endpoint checkout trực tiếp trả HTTP 410 kèm hướng dẫn dùng reservation; service trực tiếp cũng từ chối tạo loan. LR-5 đã chuyển Frontend sang `/api/reservations`; client cũ còn gọi checkout sẽ nhận 410. Marker chuyển tồn kho LR-1 hiện đã có trên MySQL live theo đối chiếu LR-7. LR-2 giữ nguyên tồn kho lúc tạo loan từ yêu cầu đã giữ bản.

**Khu vực chính:** `ReservationServiceImpl`, `BookLoanServiceImpl`, `ReservationController`, `BookLoanController` và test lifecycle/security.

**Hoàn tất khi:** một lần xác nhận giao chỉ tạo một lượt mượn.

### LR-3 — Xác nhận luồng trả sách và tiền phạt

- [x] Giữ USER gửi yêu cầu trả và ADMIN thực hiện check-in.
- [x] Xác nhận ngày nhận không sớm hơn ngày yêu cầu trả.
- [x] Giữ các kết quả `RETURNED`, `DAMAGED`, `LOST` và mức phạt đã chốt.
- [x] Khi sách có thể quay lại kho, kích hoạt đúng người đầu hàng chờ.
- [x] Kiểm tra lại notification cho USER và ADMIN (đối chiếu code, chưa kiểm thử).

**LR-3 đã rà soát/sửa code, chờ USER kiểm thử và nghiệm thu.** Không chạy test/build, không thay đổi MySQL live trong phiên này.

- Hoàn kho chỉ cho `RETURNED`; sách `DAMAGED`/`LOST` không tự trở lại số bản có thể cho mượn. Chưa bổ sung nghiệp vụ sửa chữa sách hỏng.
- Điều chỉnh tồn kho ngày 21/11/2026: check-in mới với `DAMAGED`/`LOST` giảm `totalCopies` một bản và giữ nguyên `availableCopies`, theo quy tắc loại bản sách khỏi kho lưu hành. Khóa sách và transaction hiện có bảo vệ thao tác; xác nhận lặp lại không trừ lần hai. Chưa chạy kiểm thử, USER phụ trách nghiệm thu. Không áp dụng hồi tố cho lịch sử cũ: cần đối chiếu tồn kho thực tế trước khi điều chỉnh dữ liệu, tránh trừ các bản đã được ADMIN xử lý. Sách hỏng được sửa chữa chỉ bổ sung lại khi thực tế đủ điều kiện lưu hành.
- Flush bản sách đã hoàn trước khi lifecycle refresh/khóa lại để phân bổ hàng chờ thấy đúng số bản mới. Flush vẫn nằm trong transaction check-in; lỗi tạo phạt/thông báo sẽ rollback cùng trạng thái và tồn kho.
- Số ngày quá hạn cuối cùng lấy theo ngày thực nhận ADMIN nhập, cùng ngày dùng tính tiền phạt; không giữ số ngày quét quá hạn lớn hơn ngày thực nhận.
- Yêu cầu trả lặp và check-in lặp chỉ trả kết quả hiện có, không phát lại thông báo hoặc hoàn kho/tạo phạt thêm.
- ADMIN nhận `RETURN_REQUESTED`; USER nhận `RETURN_CHECKED_IN`, và `FINE_CREATED` nếu có phạt. Publisher hiện chống trùng theo sự kiện/nguồn/người nhận.
- Giữ công thức: hư hỏng nhẹ 25%, nặng 75%; mất 100% + 20.000đ; quá hạn 5.000đ/ngày, tối đa giá tham chiếu. Giá thiếu cần ADMIN xác nhận dùng giá mặc định trước khi tạo phạt. Giữ kiểm tra ngày nhận không trước ngày yêu cầu (hoặc ngày mượn nếu nhận trực tiếp), không ở tương lai.

**Khu vực chính:** `BookLoanServiceImpl`, fine service, notification publisher và test check-in/fine.

**Hoàn tất khi:** trả bình thường, hư hỏng và mất đều kết thúc loan đúng một lần.

### LR-4 — Tự động cập nhật quá hạn

- [x] Tạo scheduler riêng gọi batch cập nhật quá hạn theo múi giờ `Asia/Ho_Chi_Minh`.
- [x] Lịch chạy được cấu hình bên ngoài source và có giá trị mặc định hằng ngày.
- [x] Dùng cơ chế chống trùng thông báo hiện có khi chạy lặp (chưa kiểm thử runtime).
- [ ] Giữ API cập nhật thủ công trong thời gian chuyển tiếp, sau đó ngừng công bố khi scheduler đã nghiệm thu.
- [ ] Bổ sung test loan đúng hạn, vừa quá hạn, đã trả và chạy scheduler lặp.

**Khu vực chính:** scheduler mới, `BookLoanServiceImpl`, cấu hình ứng dụng và `BookLoanOverdueBatchTests`.

**LR-4 đã sửa code, chờ USER kiểm thử/nghiệm thu.** Không viết/chạy test, không chạy build hoặc thay đổi MySQL live trong phiên này.

- `BookLoanOverdueScheduler` chạy mặc định **00:05 hằng ngày**, múi giờ cố định `Asia/Ho_Chi_Minh`; ngày dùng để tính quá hạn cũng theo múi giờ này.
- `LOAN_OVERDUE_ENABLED=true` bật lịch; đặt `false` để tắt. `LOAN_OVERDUE_CRON` nhận cron Spring gồm 6 trường, mặc định `0 5 0 * * *`. Cấu hình khi khởi động Backend. Có thể dùng `0 * * * * *` để USER nghiệm thu mỗi phút, rồi khôi phục lịch hằng ngày.
- Chỉ cập nhật loan còn hoạt động có hạn trả trước hôm nay; khóa và đọc lại từng loan trước khi sửa. Loan đúng hạn hoặc đã kết thúc được bỏ qua. Scheduler chỉ ghi trạng thái/số ngày và thông báo, không tự tạo tiền phạt; phạt vẫn phát sinh khi ADMIN check-in.
- Scheduler gọi entry point nội bộ qua Spring service để chạy trong transaction, không cần phiên đăng nhập. API ADMIN hiện có vẫn kiểm tra quyền, không được đổi sang entry point nội bộ.
- Thông báo `LOAN_OVERDUE` dùng khóa chống trùng theo sự kiện, loan và người nhận. Outbox chỉ được thêm khi thông báo mới được insert. Lỗi batch được ghi log; transaction rollback và lịch kế tiếp thử lại.
- Backend phải đang chạy vào giờ đã cấu hình. Nếu bỏ lỡ lịch vì tắt máy, lần chạy kế tiếp quét toàn bộ loan quá hạn còn hoạt động, không chỉ loan vừa đến hạn. API ADMIN thủ công vẫn giữ để hỗ trợ giai đoạn chuyển tiếp; LR-6 đã bỏ nút gọi API này khỏi giao diện.

**Hoàn tất khi:** trạng thái quá hạn tự cập nhật mà không cần ADMIN thao tác.

### LR-5 — Đồng bộ Frontend USER

- [x] Đổi hành động trực tiếp thành “Đăng ký mượn sách”.
- [x] Sách còn tạo yêu cầu chờ nhận; sách hết tạo yêu cầu hàng chờ.
- [x] Hiển thị rõ `PENDING`, `AVAILABLE`, hạn nhận, vị trí hàng chờ và quyền hủy.
- [x] Chỉ hiển thị sách trong “Sách đang mượn” sau khi ADMIN giao (trang này tiếp tục lấy dữ liệu từ API loan).
- [x] Loại bỏ lời nhắn gây hiểu rằng bấm nút là đã nhận sách.
- [x] Cập nhật test API/UI cho book detail, reservation và loan (LR-7 chạy Frontend suite 112/112 đạt).

**LR-5 đã sửa code, chờ USER kiểm thử/nghiệm thu.** Theo yêu cầu, không chạy test/build. Chi tiết sách USER và trang chi tiết catalog công khai nay dùng chung hành động reservation: còn bản hiển thị “Đăng ký mượn sách”, hết bản hiển thị “Đặt giữ sách (Xếp hàng)”. Kết quả API `AVAILABLE` giải thích đang chờ ADMIN giao; `PENDING` hiển thị vị trí chờ. Không còn gọi API checkout trực tiếp từ các trang này. Hạn nhận hiển thị trên thẻ đặt giữ; yêu cầu đang hoạt động có quyền hủy.

**Khu vực chính:** `ReservationAction.jsx`, `BookDetailPage.jsx`, `MyReservationCard.jsx`, API reservations/loans.

**Hoàn tất khi:** USER phân biệt được “đã đăng ký”, “sẵn sàng nhận” và “đang mượn”.

### LR-6 — Đồng bộ Frontend ADMIN

- [x] Bỏ nút “Cấp sách” chung và modal tạo loan tự do.
- [x] Bỏ nút “Cập nhật quá hạn” sau khi LR-4 đã có scheduler.
- [x] Giữ “Xác nhận giao sách” trên từng reservation `AVAILABLE`.
- [x] Giữ “Xác nhận nhận sách” trên từng yêu cầu trả.
- [x] Thêm bốn thẻ số liệu: Chờ giao, Đang mượn, Chờ xác nhận trả, Quá hạn.
- [x] Thẻ số liệu lấy tổng từ Backend và có thể chuyển bộ lọc tương ứng.
- [x] Cập nhật test admin loans và admin reservations (LR-7 chạy Frontend suite 112/112 đạt).

**LR-6 đã sửa code, chờ USER kiểm thử/nghiệm thu.** Theo yêu cầu, không chạy test/build. Trang Mượn – trả không còn thao tác tạo loan tự do hoặc cập nhật quá hạn thủ công; thao tác nhận trả chỉ xuất hiện nếu USER đã gửi yêu cầu trả. Bốn thẻ thống kê lấy `totalElements` từ API; thẻ Chờ giao mở trang Đặt giữ đã lọc `AVAILABLE`, các thẻ còn lại chọn bộ lọc loan tương ứng. Trên trang Đặt giữ, giao sách được bật cho yêu cầu `AVAILABLE` còn hạn; bản sách đã được giữ riêng khi chuyển sang trạng thái này nên giao diện không dựa vào số bản tồn kho chung hoặc vị trí hàng chờ để quyết định.

**Khu vực chính:** `AdminLoansPage.jsx`, `AdminReservationsPage.jsx`, `adminLoans.js`, `adminReservations.js` và các test liên quan.

**Hoàn tất khi:** ADMIN chỉ thao tác trên hồ sơ cụ thể, không còn nút nghiệp vụ chung gây trùng luồng.

### LR-7 — Nghiệm thu và đồng bộ tài liệu

- [ ] Chạy toàn bộ test Backend liên quan; hiện bị chặn trước khi test chạy bởi lỗi biên dịch test `BookCoverStorageServiceTests.java:116` (method `deleteUnreferenced` không tồn tại).
- [x] Chạy 112 test Frontend: 112 đạt, 0 lỗi; chạy `npm run build`: thành công.
- [x] Biên dịch/đóng gói phần ứng dụng Backend bằng Maven Wrapper với `maven.test.skip=true`: thành công. Đây không thay thế kết quả test Backend.
- [x] Đối chiếu schema và số lượng dữ liệu MySQL live bằng các câu `SELECT`/metadata; không chạy câu lệnh ghi dữ liệu hoặc DDL trong LR-7.
- [ ] Kiểm thử toàn bộ năm luồng tại phần 7 trên MySQL live bằng dữ liệu thử nghiệm có kiểm soát. Chưa thực hiện vì bộ test Backend không biên dịch được, Frontend local không mở cổng 5173 trong ảnh môi trường và cần tránh tự tạo/xóa dữ liệu trên schema đang chứa dữ liệu người dùng.
- [x] Không sửa dữ liệu lịch sử trong quá trình nghiệm thu LR-7; chỉ đọc schema, marker migration và số lượng theo trạng thái.
- [x] Đồng bộ tài liệu API/khóa luận theo endpoint và nghiệp vụ trong code hiện tại.
- [x] Ghi kết quả từng luồng ở bảng bên dưới.

#### Kết quả đối chiếu MySQL live — 20/11/2026

| Hạng mục | Kết quả đọc chỉ đọc |
| --- | --- |
| Schema đang dùng | `library_db1`; MySQL `9.2.0` |
| Marker inventory LR-1 | `LR1_RESERVED_COPIES`, đã ghi nhận `2026-11-20 16:16:04` |
| Cấu trúc bảng | `book_loans` 20 cột + `reservations` 14 cột; tổng 34 cột, khớp source schema |
| Ràng buộc | 2 primary key, 5 foreign key và 14 CHECK; tên/nhóm điều kiện khớp `database/library_db1.sql` |
| Cột từng làm Backend dừng khởi động | `book_reviews.is_anonymous` hiện có kiểu `tinyint(1)`, `NOT NULL`, mặc định `0`; khớp khai báo source. Metadata hiện tại không còn thiếu cột này; đây không thay thế phép xác minh khởi động ứng dụng |
| `book_loans` | `CHECKED_OUT` 1; `DAMAGED` 1; `LOST` 1; `RETURNED` 3; tổng 6 |
| `reservations` | `CANCELLED` 1; các trạng thái khác 0; tổng 1 |
| Tác động trong LR-7 | Không chạy `INSERT`/`UPDATE`/`DELETE`/`ALTER`; dữ liệu hiện có không bị tác động bởi lượt nghiệm thu này |

#### Kết quả kiểm thử luồng

| Luồng | Đối chiếu code/hợp đồng | Kiểm thử E2E trên live |
| --- | --- | --- |
| Sách còn bản: tạo yêu cầu → `AVAILABLE` → ADMIN giao → tạo loan | Có đường code; Frontend dùng reservation, fulfill tạo đúng loan theo transaction | Chưa chạy |
| Sách hết bản: `PENDING` → đến lượt thành `AVAILABLE` | Có đường code; mỗi yêu cầu được kích hoạt giữ một bản và có hạn nhận 72 giờ | Chưa chạy |
| Không đến nhận: hết 72 giờ → `EXPIRED` → nhường bản cho hàng chờ | Scheduler quét mặc định mỗi 60 giây, batch 100 | Chưa chạy |
| Trả sách: USER yêu cầu → ADMIN check-in `RETURNED`/`DAMAGED`/`LOST` | Có endpoint USER/ADMIN; chỉ `RETURNED` hoàn bản sẵn có; tiền phạt theo loại check-in | Chưa chạy |
| Quá hạn: scheduler đổi trạng thái và thông báo | Scheduler mặc định 00:05 `Asia/Ho_Chi_Minh`; API ADMIN fallback vẫn tồn tại nhưng Frontend đã bỏ nút | Chưa chạy |

**Kết luận LR-7:** nghiệm thu source, build Frontend, test Frontend và đối chiếu schema live đã hoàn tất. Chưa thể ghi nhận nghiệm thu trọn luồng vì Backend test compile đang lỗi và chưa chạy E2E qua API/UI. Không coi đây là xác nhận vận hành thành công trên MySQL live.

**Hoàn tất khi:** luồng mới hoạt động trọn vẹn và không còn hai cách tạo lượt mượn song song.

## 10. Tiêu chí nghiệm thu tổng thể

- USER không thể tạo `BookLoan` trực tiếp.
- Mỗi yêu cầu sẵn sàng nhận giữ đúng một bản sách.
- Chỉ ADMIN xác nhận giao mới bắt đầu lượt mượn.
- `checkoutDate` và `dueDate` không được tính trước thời điểm giao.
- Hủy/hết hạn yêu cầu hoàn kho và chuyển hàng chờ chính xác.
- ADMIN không còn thao tác “Cấp sách” và “Cập nhật quá hạn” trên giao diện cuối cùng.
- Yêu cầu trả và check-in hiện có tiếp tục hoạt động.
- Tiền phạt chỉ phát sinh theo kết quả check-in và quy tắc đã chốt.
- Scheduler cập nhật quá hạn tự động và chạy lặp an toàn.
- Dữ liệu lịch sử cũ không bị sửa hoặc xóa.

## 11. Nhật ký tiến độ

| Giai đoạn | Trạng thái | Ghi chú |
| --- | --- | --- |
| LR-0 | Hoàn tất một phần | Schema/dữ liệu live đã đối chiếu ở LR-7; test bảo vệ lịch sử còn bị blocker biên dịch test |
| LR-1 | Đã chuyển đổi schema live; E2E còn chờ | Marker inventory đã có; chưa chạy luồng USER/ADMIN trên live |
| LR-2 | Đã sửa code, chờ nghiệm thu | ADMIN giao từ reservation; checkout trực tiếp trả 410 |
| LR-3 | Đã sửa code, chờ nghiệm thu | Hoàn kho/hàng chờ, lịch sử quá hạn và thao tác lặp |
| LR-4 | Đã sửa code, chờ nghiệm thu | Lịch 00:05 giờ Việt Nam, giữ API ADMIN chuyển tiếp |
| LR-5 | Đã sửa code, chờ nghiệm thu | Chi tiết sách gửi reservation, phân biệt chờ giao/hàng đợi |
| LR-6 | Đã sửa code, chờ nghiệm thu | Bỏ cấp loan tự do; thêm thống kê; giữ thao tác theo từng yêu cầu |
| LR-7 | Đã đồng bộ tài liệu; nghiệm thu E2E còn chờ | Frontend 112/112 test và build đạt; Backend main build đạt nhưng testCompile lỗi độc lập; MySQL live đã đối chiếu chỉ đọc; năm luồng chưa chạy E2E |

