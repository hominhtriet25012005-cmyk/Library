# AD9 — Nghiệm thu ADMIN (lượt 08/10/2026)

**Kết luận: đạt phần kiểm thử tự động; chưa đủ điều kiện đóng nghiệm thu end-to-end.** MySQL `library_db1` tại `127.0.0.1:3306`, backend `:8000` và frontend `:5173` đều không mở cổng trong lượt kiểm tra. Vì vậy chưa thể xác nhận startup với MySQL chính, đăng nhập ADMIN thật, thao tác đọc/ghi API trên database chính hay giao diện responsive trong trình duyệt. Không đổi schema, không ghi/xóa dữ liệu MySQL và không gọi payOS.

## Bằng chứng vừa chạy

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Backend `clean compile` | **PASS**, exit 0 | Chứng minh biên dịch, không chứng minh runtime. |
| Backend `package -DskipTests` | **PASS**, exit 0 | Tạo JAR; test đã chạy riêng. |
| Backend `test` mặc định | **FAIL: 110 ca, 0 failures, 1 error** | Chỉ `LibraryApplicationTests.contextLoads` lỗi khi Hibernate không lấy được JDBC metadata vì MySQL không kết nối. Không coi đây là lỗi mapping đã xác nhận. |
| Backend không cần MySQL (`*Tests`, bỏ `LibraryApplicationTests`) | **PASS: 109/109**, 31 test suites, 0 fail/error/skip | Có test HTTP security, service và H2; không gồm lớp `*IT`/MySQL opt-in. |
| Frontend `npm test` | **PASS: 66/66** | Test adapter/quy tắc và route, không phải phiên trình duyệt ADMIN thật. |
| Frontend `npm run lint` | **PASS** | Sau khi cài lại dependency bằng `npm ci`. |
| Frontend `npm run build` | **PASS** | Vite còn cảnh báo chunk JS lớn và `use client` từ dependency; không phải lỗi build. |
| TCP localhost `3306`, `8000`, `5173` | **Không mở cả ba cổng** | Không có môi trường live để smoke UI/API. |

`npm ci` ban đầu bị thiếu cache và để lại `node_modules` dở; thư mục dở đó đã được dọn và cài sạch lại thành công (220 packages). Không thay đổi source để vượt qua test.

## Ma trận nghiệm thu AD0–AD8

| Đợt | Đã xác nhận qua mã/test | Chưa xác nhận trong AD9 |
|---|---|---|
| AD0 — Nền/quyền | Route 10 mục, guard ADMIN/USER, chuyển khu dùng cùng phiên; test frontend và các HTTP security test đạt. | Login thật, điều hướng và menu mobile bằng trình duyệt. |
| AD1 — Dashboard | Adapter lấy thống kê sách và `totalElements` lượt mượn; test dữ liệu rỗng/lỗi đạt. | Số thực từ MySQL và đối chiếu với bảng gốc. |
| AD2 — Sách/thể loại | Test catalog, quyền HTTP, khóa tồn kho/cây cha–con trên H2 đạt. | Thêm/sửa/ẩn/hiện trên MySQL chính, kiểm tra đồng thời sửa tồn kho với mượn/trả, trình bày responsive. |
| AD3 — Người dùng | API list chỉ ADMIN, không trả password hash theo test; giao diện tìm/lọc hoạt động ở mức test. | Tài khoản ADMIN thật và hiệu năng khi danh sách lớn (hiện tải toàn bộ rồi phân trang ở frontend). |
| AD4 — Mượn/trả | Test HTTP quyền, service/H2 và batch quá hạn đạt. | Cấp/trả/gia hạn/quá hạn trên MySQL chính; quy tắc tồn kho sách `DAMAGED` và lịch sử `overdueDays` vẫn cần chốt riêng. |
| AD5 — Đặt giữ | Test hàng đợi, rollback, quyền `fulfill` ADMIN và adapter frontend đạt. | Luồng đặt giữ → giao sách → lượt mượn trên MySQL thật; job/email tự chuyển trạng thái chưa có trong V1. |
| AD6 — Gói thành viên | Test danh mục ADMIN/USER, tạo gói và tra cứu đăng ký H2 đạt. | Tạo gói trên MySQL thật; thao tác ngừng/mở bán chưa được chốt/triển khai trên UI; không thử thanh toán thật. |
| AD7 — Tiền phạt/thanh toán | Test API, quyền, tạo/miễn fine và quy tắc đối soát payOS đạt ở mức tự động. | Ghi/đọc fine trên MySQL; đối soát staging và thanh toán thực tế. Tạo đơn thật vẫn tắt mặc định. |
| AD8 — Đánh giá/Topbar | Test ADMIN search/hide, USER chỉ thấy review active, quyền HTTP/H2; mật độ hiển thị lưu cục bộ. | Thao tác ẩn trên MySQL và xem trực tiếp ở UI. V1 không lưu người/lý do/thời điểm kiểm duyệt theo quyết định đã chốt. |

## Rủi ro và việc cần làm trước khi đóng AD9

1. **BLOCKER môi trường:** bật MySQL Server chứa `library_db1`, sau đó kiểm tra kết nối, khởi động Spring Boot với `ddl-auto=validate`, đăng nhập ADMIN và smoke các API chỉ đọc. Không dùng `update`/tạo lại schema.
2. **BLOCKER nghiệm thu thao tác ghi:** chuẩn bị database thử nghiệm hoặc một kế hoạch fixture/rollback được duyệt trước khi thử thêm/sửa/ẩn, mượn/trả, đặt giữ, fine, review; không dùng dữ liệu chính làm fixture tùy tiện.
3. **HIGH bảo mật triển khai:** khóa JWT và mật khẩu DB/mail vẫn có giá trị trực tiếp trong source/cấu hình (FR-03). Phải chuyển sang secret môi trường và xoay khóa đã lộ trước khi công khai hệ thống; không ghi giá trị vào báo cáo.
4. **Chưa chốt phạm vi AD6:** nút ngừng/mở bán gói chưa làm; không gọi AD6 là hoàn chỉnh nghiệp vụ quản trị gói.
5. **Không diễn giải quá mức test:** `mvn test` mặc định không tự chạy các lớp MySQL `*IT` (FR-06); test H2/MockMvc không thay thế DB chính, webhook HTTPS, QR/chuyển tiền thật hoặc kiểm tra responsive trực tiếp.
6. **LOW hiệu năng frontend:** bundle JS ~859 kB trước gzip; build vẫn đạt, có thể tách chunk sau nghiệm thu chức năng. Không thay đổi kiến trúc trong AD9.

**Mốc đóng AD9:** ghi bằng chứng startup Hibernate `validate`, API đọc ADMIN/USER và phân quyền trên MySQL, kết quả các luồng ghi trên môi trường thử an toàn, ảnh/chốt responsive desktop–mobile, và quyết định các rủi ro trên. Lượt hiện tại không đủ bằng chứng để đánh dấu toàn bộ ADMIN “hoàn tất”.
