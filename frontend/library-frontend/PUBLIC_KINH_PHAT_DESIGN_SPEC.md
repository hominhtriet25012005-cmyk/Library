# ĐẶC TẢ THIẾT KẾ GIAO DIỆN PUBLIC

## Đề tài: Thiết kế và xây dựng hệ thống website quản lý thư viện sách kinh Phật

**Phiên bản:** Đề xuất thiết kế lại — 11/11/2026  
**Phạm vi:** Bốn trang Public (`/`, `/about`, `/contact`, `/books`) và hai thành phần dùng chung (Navbar, Footer). Trang chi tiết sách là luồng liên kết, không tính thêm một mục menu Public.  
**Trạng thái:** Tài liệu thiết kế; **chưa sửa source code**.

---

## 1. Định hướng thiết kế

Thay cách thể hiện của một website quản lý sách thông thường bằng trải nghiệm **thư viện kinh sách Phật giáo**: trang nhã, tĩnh tại, dễ đọc, tin cậy và thuận tiện cho cả người tìm đọc lần đầu lẫn người nghiên cứu lâu dài. Tránh kiểu thương mại điện tử, hình ảnh hoặc thuật ngữ quá phô trương.

### 1.1 Nguyên tắc

- **Lấy kinh sách làm trung tâm:** nổi bật tìm kiếm, phân loại, thông tin xuất bản, tình trạng bản sách và quy trình mượn/đặt giữ.
- **Tôn trọng nội dung Phật học:** mô tả rõ ràng, ngôn từ giản dị; không dùng thông điệp mang tính quảng cáo cường điệu hoặc hứa hẹn kết quả tâm linh.
- **Không bịa dữ liệu:** số đầu sách, tỷ lệ hài lòng, địa chỉ, giờ làm việc, hotline, tên đơn vị và tình trạng sách phải lấy từ dữ liệu thật hoặc để chờ cấu hình.
- **Phù hợp đồ án quản lý thư viện:** ưu tiên luồng tra cứu, đăng nhập, mượn sách, đặt giữ, đánh giá và quản trị; không tự thêm đọc sách điện tử, phát audio, quyên góp hay cổng thanh toán vào Public nếu backend không hỗ trợ.
- **Responsive và dễ tiếp cận:** thiết kế trước cho điện thoại, có trạng thái loading/empty/error, bàn phím truy cập được, tương phản rõ.

### 1.2 Nhận diện thị giác

| Thành phần     | Đề xuất                                                                        | Mục đích                             |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| Màu nền        | `#FAF8F3` (kem ngà), `#FFFFFF`                                                 | Sáng, dễ đọc                         |
| Màu chủ đạo    | `#315B4C` (xanh lá trầm)                                                       | Điềm tĩnh, đáng tin                  |
| Màu nhấn       | `#A98247` (vàng đồng nhạt)                                                     | Sắc thái trang trọng, dùng tiết chế  |
| Chữ chính      | `#26332D`                                                                      | Tương phản cao                       |
| Chữ phụ        | `#64716A`                                                                      | Phân cấp nội dung                    |
| Viền/phân cách | `#E7E4DB`                                                                      | Gọn, không nặng                      |
| Cảnh báo/lỗi   | Dùng màu trạng thái riêng dễ nhận biết, không chỉ phân biệt bằng màu           | Dễ tiếp cận                          |
| Font           | `Be Vietnam Pro`/`Inter` cho văn bản; có thể dùng `Noto Serif` cho tiêu đề lớn | Hỗ trợ dấu tiếng Việt                |
| Họa tiết       | Hoa sen dạng nét mảnh, kệ kinh sách, họa tiết trang sách                       | Chỉ phụ trợ, không làm rối giao diện |

Nút chính nền xanh trầm, chữ trắng; nút phụ viền xanh. Không sử dụng quá nhiều gradient, hiệu ứng chuyển động hoặc ảnh Phật mang tính trang trí không liên quan.

### 1.3 Bố cục dùng chung

- **Max-width nội dung:** khoảng 1200–1280 px; lề hai bên desktop 24–32 px, mobile 16 px.
- **Khoảng cách section:** khoảng 64–88 px desktop, 40–56 px mobile.
- **Card:** bo góc 12–16 px, đổ bóng rất nhẹ hoặc dùng viền mảnh.
- **Trên mobile:** menu hamburger, tìm kiếm chiếm đủ bề rộng, card sách 2 cột (hoặc 1 cột khi quá hẹp), bộ lọc thu gọn trong drawer.
- **Thứ tự menu:** Trang chủ · Kho kinh sách · Giới thiệu · Liên hệ.

---

## 2. Navbar chung

**Bố cục desktop:** Logo + tên **Thư viện Kinh sách Phật giáo** (trái) | 4 liên kết (giữa) | biểu tượng tìm kiếm (tùy chọn), Đăng nhập/Đăng ký hoặc Avatar (phải).

- **Khách:** `Đăng nhập` (nút phụ), `Đăng ký` (nút chính).
- **Đăng nhập với USER:** Avatar/menu `Khu vực bạn đọc`, `Tài khoản`, `Đăng xuất`.
- **Đăng nhập với ADMIN:** Avatar/menu `Khu quản trị`, `Đăng xuất` (không hiển thị hành động không đúng vai trò).
- Navbar dính nhẹ khi cuộn; highlight đường dẫn đang mở; hỗ trợ tab/Enter/Escape trên menu.
- Tránh đưa chức năng quản trị trực tiếp vào menu công khai.

---

## 3. Trang chủ (`/`)

**Mục tiêu:** giới thiệu bản sắc thư viện kinh sách, đưa người dùng tới kho sách và giúp hiểu cách mượn.

### Thứ tự khối nội dung

**Khối A — Hero:** hai cột desktop, một cột mobile.

- Nhãn nhỏ: `KHÔNG GIAN TRI THỨC PHẬT HỌC`.
- Tiêu đề: **“Khám phá kho tàng kinh sách Phật giáo”**.
- Mô tả: “Tra cứu kinh điển, sách Phật học và tài liệu nghiên cứu trong một không gian đọc thuận tiện, rõ ràng và dễ tiếp cận.”
- Thanh tìm kiếm lớn placeholder: `Tìm theo tên kinh, tên sách, tác giả hoặc dịch giả...`; nút `Tìm kinh sách` → `/books?q=<từ khóa>`.
- Hai CTA: `Khám phá kho kinh sách` → `/books`; `Hướng dẫn mượn sách` → anchor `#huong-dan-muon`.
- Hình minh họa: ảnh sách/giá sách đúng bản quyền hoặc tranh minh họa kệ kinh sách, không dùng ảnh stock sai bối cảnh.

**Khối B — Giá trị nổi bật:** thay hàng chỉ số `15.000+`, `99,8%`, `24/7 VietQR` (không có dữ liệu xác nhận) bằng 3 thẻ lợi ích:

1. `Tra cứu tập trung` — Tìm sách theo tên và thông tin cơ bản.
2. `Theo dõi tình trạng sách` — Biết sách còn để mượn hoặc có thể đặt giữ.
3. `Quản lý mượn trả thuận tiện` — Theo dõi tiến trình từ tài khoản bạn đọc.

**Khối C — Danh mục kinh sách:** tiêu đề `Khám phá theo chủ đề`; card danh mục sinh từ database; có thể gợi ý _Kinh điển_, _Luận giải_, _Phật học căn bản_, _Ứng dụng Phật học_, _Sách nghiên cứu_ **chỉ khi CSDL có các thể loại tương ứng**. Mỗi card dẫn tới `/books?category=<id>` (hoặc tham số lọc hiện có).

**Khối D — Kinh sách mới và nổi bật:** tiêu đề `Kinh sách dành cho bạn khám phá`; 4–8 card lấy từ API, mỗi card hiển thị ảnh bìa thật (hoặc placeholder), tên sách, tác giả/dịch giả (nếu có), thể loại, trạng thái sẵn có, nút `Xem chi tiết`. Không bịa nhãn `Bán chạy` hay `Được yêu thích` nếu không đo lường được.

**Khối E — Hướng dẫn mượn sách:** id `huong-dan-muon`; 4 bước: `Tra cứu` → `Xem thông tin & tình trạng` → `Gửi yêu cầu mượn/đặt giữ` → `Nhận, trả và theo dõi lịch sử`. Diễn đạt theo đúng quy trình backend; không cam kết gia hạn online nếu chưa triển khai.

**Khối F — Giới thiệu thư viện:** ảnh không gian sách + 2–3 dòng giới thiệu sứ mệnh, nút `Tìm hiểu thêm` → `/about`.

**Khối G — CTA cuối trang:** “Bắt đầu hành trình khám phá kinh sách” với nút `Xem kho kinh sách` và `Tạo tài khoản` (chỉ cho khách; người đã đăng nhập có CTA vào khu vực bạn đọc).

**Không nên đặt gói hội viên hoặc cổng thanh toán làm trọng tâm trang chủ**; chỉ giới thiệu tùy chọn nếu đây là nghiệp vụ thực tế, đã có chính sách rõ ràng và API hỗ trợ.

**Wireframe (desktop):**

```text
┌──────────────────────────── Navbar ────────────────────────────┐
│ [Logo Thư viện Kinh sách]  Trang chủ  Kho sách  Giới thiệu ... │
├────────────────────────────────────────────────────────────────┤
│ KHÔNG GIAN TRI THỨC PHẬT HỌC          [Ảnh kệ kinh sách]       │
│ Khám phá kho tàng kinh sách...                                  │
│ [ Tìm tên kinh, sách, tác giả...            ][ Tìm kinh sách ] │
│ [ Khám phá kho sách ] [ Hướng dẫn mượn ]                        │
├────────────────────────────────────────────────────────────────┤
│ [Tra cứu tập trung] [Tình trạng sách] [Mượn trả thuận tiện]   │
├────────────────────────────────────────────────────────────────┤
│ Khám phá theo chủ đề        [Danh mục] [Danh mục] [Danh mục]    │
├────────────────────────────────────────────────────────────────┤
│ Kinh sách mới và nổi bật    [Sách] [Sách] [Sách] [Sách]          │
├────────────────────────────────────────────────────────────────┤
│ Hướng dẫn mượn:     01 ── 02 ── 03 ── 04                       │
├────────────────────────────────────────────────────────────────┤
│ Về thư viện       [Ảnh] [Mô tả và liên kết Giới thiệu]          │
├────────────────────────────────────────────────────────────────┤
│ CTA khám phá kinh sách                                           │
└──────────────────────────── Footer ────────────────────────────┘
```

---

## 4. Kho kinh sách (`/books`)

**Mục tiêu:** người dùng tìm được đúng kinh/sách, đọc thông tin và quyết định mượn hay đặt giữ.

### 4.1 Header

- Breadcrumb `Trang chủ / Kho kinh sách`.
- Tiêu đề **“Kho kinh sách Phật giáo”**; mô tả ngắn về cách tra cứu.
- Số kết quả chỉ hiển thị khi API có tổng số bản ghi chính xác.

### 4.2 Tìm kiếm, lọc và sắp xếp

- Tìm kiếm: tên kinh/sách, tên tác giả hoặc dịch giả; ISBN nếu dữ liệu có.
- Bộ lọc tối thiểu: `Thể loại`, `Tình trạng còn sách`, `Sắp xếp`.
- Nếu backend hỗ trợ: mở rộng `Ngôn ngữ`, `Nhà xuất bản`, `Năm xuất bản` và phân loại bộ kinh. Không thêm bộ lọc vô hiệu.
- Bộ lọc desktop ở sidebar bên trái hoặc thanh nằm ngang tùy kích thước; mobile mở drawer.
- Nút `Xóa bộ lọc`, giữ bộ lọc trên URL (query string) để chia sẻ đường dẫn.
- Sắp xếp hợp lệ theo các trường backend có (tên A–Z, mới cập nhật, năm xuất bản).

### 4.3 Thẻ sách

Mỗi card hiển thị:

1. Bìa sách (tỷ lệ cố định, có ảnh thay thế khi thiếu).
2. Tên kinh/sách (không cắt mất thông tin quan trọng, tối đa 2 dòng trên card).
3. Tác giả / dịch giả / người biên soạn nếu có.
4. Nhãn thể loại và thông tin xuất bản ngắn (nếu có).
5. Tình trạng lấy từ API: `Còn sách`, `Tạm hết sách`, hoặc trạng thái đúng với backend.
6. `Xem chi tiết` là hành động chính; `Mượn/Đặt giữ` chỉ hiển thị khi luồng nghiệp vụ cho phép.

### 4.4 Quy tắc truy cập

- Khách: xem danh sách, lọc và chi tiết công khai; nếu nhấn mượn/đặt giữ, chuyển đăng nhập kèm đường dẫn quay lại sách vừa xem.
- USER: tiếp tục đúng luồng mượn hoặc đặt giữ đang hỗ trợ; thông báo rõ nếu yêu cầu cần duyệt.
- ADMIN: không hiển thị nút thao tác bạn đọc không phù hợp với quyền.
- Không tạo yêu cầu đặt giữ nếu backend hoặc điều kiện sách không cho phép.

### 4.5 Phân trang và trạng thái

- Pagination theo API (nếu có), đổi trang không mất từ khóa/bộ lọc.
- Loading có skeleton; không có kết quả thì hiển thị `Không tìm thấy kinh sách phù hợp` và nút `Xóa bộ lọc`.
- Lỗi mạng/API: thông báo ngắn và nút `Thử lại`; không hiển thị dữ liệu giả như thể thật.

**Wireframe:**

```text
Breadcrumb  /  KHO KINH SÁCH PHẬT GIÁO
[ Tìm theo tên sách/tác giả...                       ][Tìm]
┌─────────────────┬──────────────────────────────────────────────┐
│ Bộ lọc          │ Sắp xếp [Tên A–Z]                           │
│ Thể loại        │ [Bìa][Bìa][Bìa]                             │
│ Tình trạng      │ [Tên][Tên][Tên]                             │
│ Xóa bộ lọc      │ [Xem][Xem][Xem]                             │
│                 │ [Bìa][Bìa][Bìa]                             │
└─────────────────┴──────────────────────────────────────────────┘
                     [ Trước ] [ 1  2  3 ] [ Sau ]
```

---

## 5. Giới thiệu (`/about`)

**Mục tiêu:** giải thích thư viện phục vụ ai, có nội dung gì và sử dụng như thế nào; không mô tả cơ sở vật chất chưa được xác nhận.

1. **Hero:** tiêu đề `Về Thư viện Kinh sách Phật giáo`, mô tả đây là nền tảng hỗ trợ quản lý, tra cứu, tiếp cận kinh sách và tài liệu Phật học.
2. **Sứ mệnh:** “Góp phần lưu giữ, hệ thống hóa và giúp bạn đọc tiếp cận tri thức Phật học một cách thuận tiện, có trách nhiệm.”
3. **Đối tượng phục vụ:** Tăng Ni, Phật tử, sinh viên, độc giả và người nghiên cứu quan tâm Phật học (điều chỉnh theo đơn vị thật).
4. **Ba giá trị:** `Gìn giữ tri thức` — `Tiếp cận thuận tiện` — `Tôn trọng và chia sẻ`.
5. **Nguồn tư liệu:** giới thiệu các nhóm sách và những thông tin thư mục được lưu trữ (tên, tác giả/dịch giả, thể loại, xuất bản, bản in). Chỉ nêu số liệu có thật.
6. **Hướng dẫn sử dụng:** tra cứu → xem chi tiết → đăng nhập → gửi yêu cầu → theo dõi và trả sách.
7. **Quy định chung:** giữ gìn tài liệu, mượn trả đúng hạn, tôn trọng không gian đọc; liên kết đến quy định chi tiết nếu có.
8. **CTA:** `Khám phá kho kinh sách`.

Không tự nhận là thư viện của chùa/trường nào, không viết “Tầng 1–3 tòa nhà”, phòng đọc máy lạnh, máy tính tra cứu nếu chưa có bằng chứng.

---

## 6. Liên hệ (`/contact`)

**Mục tiêu:** người dùng có thể gửi yêu cầu, góp ý và biết kênh liên hệ chính thức.

**Header:** `Liên hệ với thư viện` — “Chúng tôi sẵn sàng tiếp nhận câu hỏi về kinh sách, tài khoản và quy trình mượn trả.”

### 6.1 Khối thông tin

- Địa chỉ: lấy từ thông tin chính thức hoặc hiển thị `Đang cập nhật`.
- Số điện thoại / email: chỉ hiển thị dữ liệu xác thực; không sử dụng số `0909 xxx xxx` hoặc email ví dụ như liên hệ thật.
- Giờ phục vụ: chỉ hiển thị nếu thư viện có địa điểm/giờ phục vụ thực tế.
- Google Maps: chỉ nhúng khi có địa chỉ xác thực; nếu hoạt động trực tuyến, không cần bản đồ.

### 6.2 Form liên hệ

- Họ và tên (bắt buộc)
- Email (bắt buộc, đúng định dạng)
- Chủ đề (chọn từ: `Hỏi về kinh sách`, `Hướng dẫn mượn trả`, `Báo lỗi hệ thống`, `Góp ý khác`)
- Tiêu đề (bắt buộc)
- Nội dung (bắt buộc, giới hạn độ dài hợp lý)
- Nút `Gửi liên hệ`; có loading, disabled khi gửi và thông báo kết quả.

**Tích hợp:** dùng API contact hiện có nếu backend hỗ trợ lưu MySQL và/hoặc gửi email. Không làm giao diện “gửi thành công” nếu thực tế chỉ gửi giả lập.

### 6.3 FAQ ngắn (tùy chọn)

- Làm sao để tìm một cuốn kinh/sách?
- Cần đăng nhập để xem danh mục không?
- Làm thế nào để gửi yêu cầu đặt giữ?
- Làm thế nào để theo dõi sách đang mượn?

Câu trả lời cần trùng khớp nghiệp vụ đang chạy.

---

## 7. Footer chung

**Cột 1:** logo, tên `Thư viện Kinh sách Phật giáo`, mô tả một câu.  
**Cột 2:** Trang chủ · Kho kinh sách · Giới thiệu · Liên hệ.  
**Cột 3:** Hướng dẫn mượn sách · Quy định mượn trả · Chính sách bảo mật (chỉ liên kết khi trang/tài liệu tồn tại).  
**Cột 4:** thông tin liên hệ xác thực hoặc `Đang cập nhật`.

Dòng cuối: `© 2026 Thư viện Kinh sách Phật giáo — Đồ án tốt nghiệp.` (thay tên theo đơn vị và branding cuối cùng). Không lấy logo chùa, biểu tượng tôn giáo hoặc thương hiệu của tổ chức nếu không có quyền sử dụng.

---

## 8. Liên kết chức năng với hệ thống hiện tại

| Nhu cầu giao diện | Backend/logic cần có                    | Nếu chưa có                                                          |
| ----------------- | --------------------------------------- | -------------------------------------------------------------------- |
| Tìm sách từ Hero  | API tìm sách, query string              | Dẫn `/books` và lọc client có giới hạn; không giả có tìm kiếm server |
| Lọc thể loại      | Danh mục thể loại và liên kết sách      | Chỉ hiện bộ lọc thực sự hoạt động                                    |
| Sách còn hay hết  | Dữ liệu số bản còn có thể mượn          | Hiện trạng thái trung tính `Xem chi tiết`                            |
| Mượn và đặt giữ   | Auth + API nghiệp vụ phù hợp            | Chỉ mở chi tiết, không đưa nút giả                                   |
| Sách nổi bật      | API sort/filter hợp lệ                  | Dùng `Sách mới cập nhật` nếu có tiêu chí thật                        |
| Thông tin liên hệ | Cấu hình hoặc thông tin đơn vị xác thực | Để `Đang cập nhật`                                                   |
| Gửi góp ý         | API form Contact đã triển khai          | Không hiển thị thông báo gửi thành công giả                          |
| Chỉ số trên Home  | Endpoint thống kê được phép public      | Không hiển thị các con số giả                                        |

**Lưu ý dữ liệu kinh sách:** trường ISBN có thể không tồn tại; tên người biên soạn/dịch giả có thể thay cho tác giả; bộ kinh và ngôn ngữ chỉ là metadata mở rộng nếu schema hiện tại hỗ trợ.

---

## 9. Tiêu chí nghiệm thu UI/UX

- [x] Navbar, Footer nhất quán trên 4 trang, active state đúng.
- [x] Trang chủ có Hero và tìm kiếm thực sự điều hướng đến kết quả.
- [x] Không còn nội dung chung chung như “15.000+ đầu sách”, “99,8% hài lòng”, “cổng VietQR 24/7” nếu không có dữ liệu thật.
- [x] Các tiêu đề, mô tả, CTA phù hợp thư viện **kinh sách Phật giáo**.
- [x] Danh mục sách/ảnh bìa/trạng thái lấy từ API, có loading, empty, error.
- [x] Guest/USER/ADMIN có hành động phù hợp quyền và luồng mượn/đặt giữ.
- [x] Form liên hệ validate, có thông báo kết quả thật từ backend / trình gửi thư thực tế.
- [x] Trang About/Contact không có địa chỉ, hotline, cơ sở vật chất hư cấu.
- [x] Responsive tốt ở 375, 768, 1280 và 1440 px; keyboard và tương phản đạt yêu cầu.
- [x] Không thay đổi backend, database, API contract, phân quyền hoặc nghiệp vụ đã chạy chỉ để khớp giao diện.

---

## 10. Quyết định kỹ thuật đã chốt & Lộ trình triển khai Code

### 10.1 Các quyết định đã xác nhận trước khi triển khai

1. **Phân quyền API đọc công khai (`SecurityConfig.java`):** Mở `permitAll()` cho các API chỉ đọc (Read-only) gồm: `GET /api/books`, `GET /api/books/*`, `GET /api/books/stats`, `POST /api/books/search`, `GET /api/genres`, `GET /api/genres/*`, và `GET /api/reviews/book/*` để khách chưa đăng nhập xem được dữ liệu kinh sách thật trên Trang chủ và Kho kinh sách. Giữ nguyên bảo mật `authenticated()` và `hasRole("ADMIN")` cho toàn bộ API nghiệp vụ còn lại.
2. **Thứ tự Menu trên `PublicNavbar`:** `Trang chủ` (`/`) · `Kho kinh sách` (`/books`) · `Giới thiệu` (`/about`) · `Liên hệ` (`/contact`).
3. **Phương án xử lý Form Liên hệ (`/contact`):** Áp dụng **Lựa chọn 1** — Không tạo thêm bảng DB mới và không làm thông báo gửi giả lập. Thực hiện validate đầy đủ trên form (Họ tên, Email, Chủ đề, Tiêu đề, Nội dung) và kết nối qua trình gửi thư thực tế (`mailto:`) kèm nội dung đã soạn sẵn hoặc sao chép thông tin liên hệ chính thức, kết hợp khối FAQ giải đáp đúng nghiệp vụ.
4. **Đóng gói bảng màu Phật giáo (`PublicLayout`):** Đóng gói bảng màu riêng (`#315B4C` xanh lá trầm, `#FAF8F3` kem ngà, `#A98247` vàng đồng nhạt, `#26332D` chữ chính, `#64716A` chữ phụ, `#E7E4DB` viền) bên trong `PublicLayout` để đạt thẩm mỹ trang nhã, tĩnh tại mà không ảnh hưởng tới giao diện `/user`, `/admin` hay bộ 106 unit tests hiện hữu.

---

### 10.2 Lộ trình triển khai Code (6 Giai đoạn)

#### Giai đoạn 1: Mở quyền đọc API Public tại Backend (`SecurityConfig.java`)

- **Mục tiêu:** Cho phép khách vãng lai (Guest) truy cập dữ liệu sách, thể loại và đánh giá sách thật từ MySQL mà không bị chặn `401/403`.
- **File cập nhật:** `Library/src/main/java/com/library/configurations/SecurityConfig.java`
- **Công việc chi tiết:**
  - Bổ sung `permitAll()` cho `GET /api/books`, `GET /api/books/*`, `GET /api/books/stats`, `POST /api/books/search`.
  - Bổ sung `permitAll()` cho `GET /api/genres`, `GET /api/genres/*`.
  - Bổ sung `permitAll()` cho `GET /api/reviews/book/*`.
  - Đặt các rule này sau các rule quản trị (`/api/reviews/admin/**`, `/api/books/bulk`) và trước `.requestMatchers("/api/**").authenticated()`.

#### Giai đoạn 2: Xây dựng Khung giao diện Public & Bảng màu Phật giáo (`PublicLayout`)

- **Mục tiêu:** Tạo bộ khung dùng chung nhất quán cho 4 trang Public với bảng màu `#FAF8F3` – `#315B4C` – `#A98247`.
- **File tạo mới:**
  - `src/pages/PublicLayout/publicTheme.js`: Khai báo bảng màu, kiểu chữ và token giao diện riêng cho khu vực Public.
  - `src/pages/PublicLayout/PublicNavbar.jsx`: Logo **Thư viện Kinh sách Phật giáo**, 4 mục menu (`Trang chủ` · `Kho kinh sách` · `Giới thiệu` · `Liên hệ`), trạng thái active, mobile drawer và nút hành động theo vai trò (`Guest` / `USER` / `ADMIN`).
  - `src/pages/PublicLayout/PublicFooter.jsx`: Chân trang 4 cột theo Mục 7, hiển thị thông tin xác thực hoặc `Đang cập nhật`.
  - `src/pages/PublicLayout/PublicLayout.jsx`: Bọc `PublicNavbar`, `<Outlet />` và `PublicFooter`.

#### Giai đoạn 3: Thiết kế lại Trang chủ (`/`) — `LandingPage.jsx`

- **Mục tiêu:** Thay thế trang chủ cũ bằng 7 khối nội dung (Khối A → Khối G) chuẩn chủ đề thư viện kinh sách Phật giáo và dùng dữ liệu thật từ API.
- **File cập nhật:** `src/pages/Home/LandingPage.jsx`
- **Công việc chi tiết:**
  - **Khối A (Hero):** Nhãn `KHÔNG GIAN TRI THỨC PHẬT HỌC`, tiêu đề, mô tả, thanh tìm kiếm điều hướng sang `/books?q=<từ_khóa>`, 2 CTA (`Khám phá kho kinh sách` & `Hướng dẫn mượn sách` `#huong-dan-muon`).
  - **Khối B (Giá trị nổi bật):** 3 thẻ lợi ích (_Tra cứu tập trung_, _Theo dõi tình trạng sách_, _Quản lý mượn trả thuận tiện_); xóa bỏ hoàn toàn các chỉ số ảo `15,000+`, `99.8%`, `VietQR 24/7`.
  - **Khối C (Khám phá theo chủ đề):** Lấy danh sách thể loại từ `booksApi.genres()`, mỗi thẻ dẫn tới `/books?genreId=<id>`.
  - **Khối D (Kinh sách mới và nổi bật):** Lấy 4–8 cuốn sách từ `booksApi.search` (`sortBy: "createdAt", sortDirection: "DESC"`), có trạng thái loading/empty/error.
  - **Khối E (Hướng dẫn mượn sách `#huong-dan-muon`):** 4 bước khớp quy trình thực tế.
  - **Khối F (Giới thiệu ngắn)** dẫn tới `/about` và **Khối G (CTA cuối trang)** theo trạng thái đăng nhập.

#### Giai đoạn 4: Xây dựng Kho kinh sách (`/books`) & Chi tiết kinh sách công khai (`/books/:id`)

- **Mục tiêu:** Cho phép tra cứu, lọc, sắp xếp kho kinh sách và xem chi tiết từng cuốn kinh sách mà không bắt buộc đăng nhập trước.
- **File tạo mới:**
  - `src/pages/PublicBooks/PublicBookCard.jsx`: Thẻ kinh sách hiển thị bìa, tên sách (tối đa 2 dòng), tác giả/dịch giả, nhãn thể loại, trạng thái `Còn sách` / `Tạm hết sách`, nút `Xem chi tiết` dẫn tới `/books/:id`.
  - `src/pages/PublicBooks/PublicBooksPage.jsx`: Tìm kiếm từ khóa, lọc `Thể loại`, lọc `Tình trạng còn sách`, sắp xếp (`createdAt`, `title`, `publicationYear`), nút `Xóa bộ lọc`, đồng bộ với URL query string và phân trang server.
  - `src/pages/PublicBooks/PublicBookDetailPage.jsx`: Hiển thị thông tin thư mục chi tiết và đánh giá bạn đọc (`booksApi.detail`, `reviewsApi.list`). Phân quyền thao tác:
    - **Guest:** Nút _"Đăng nhập để mượn / đặt giữ"_ chuyển tới `/login` kèm đường dẫn quay lại sách vừa xem (`state={{ from: location }}`).
    - **USER:** Cho phép đặt giữ khi sách tạm hết bản in hoặc mở trong khu vực bạn đọc `/user/books/:id`.
    - **ADMIN:** Hiển thị lối tắt quản trị sách, không hiển thị nút thao tác bạn đọc.

#### Giai đoạn 5: Xây dựng Trang Giới thiệu (`/about`) & Trang Liên hệ (`/contact`)

- **Mục tiêu:** Hoàn thiện 2 trang thông tin giới thiệu và hỗ trợ bạn đọc trung thực, không hư cấu dữ liệu.
- **File tạo mới:**
  - `src/pages/About/AboutPage.jsx`: Triển khai 8 mục nội dung theo Phần 5 (Hero, Sứ mệnh, Đối tượng phục vụ, 3 Giá trị, Nguồn tư liệu thật, Hướng dẫn sử dụng, Quy định chung, CTA sang `/books`).
  - `src/pages/Contact/ContactPage.jsx`: Triển khai theo Phần 6 & Lựa chọn 1 (Khối thông tin liên hệ xác thực hoặc `Đang cập nhật`, Form liên hệ validate đầy đủ kết nối trình gửi thư thực tế, kèm FAQ 4 câu hỏi khớp nghiệp vụ).

#### Giai đoạn 6: Đấu nối Định tuyến (`App.jsx`) & Kiểm thử Nghiệm thu

- **Mục tiêu:** Kết nối các route Public vào `App.jsx` và kiểm chứng toàn bộ hệ thống.
- **File cập nhật:** `src/App.jsx`
- **Công việc chi tiết:**
  - Bọc các route `/`, `/books`, `/books/:id`, `/about`, `/contact` trong `PublicLayout`.
  - Gỡ bỏ redirect cứng `/books -> /user/books` để khách vãng lai truy cập được `/books`.
  - Chạy toàn bộ unit tests (`npm test`) và build (`npm run build`), đối chiếu từng mục trong Checklist nghiệm thu Mục 9.
