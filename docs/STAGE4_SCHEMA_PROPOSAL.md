# Giai đoạn 4 — Đề xuất đồng bộ Backend và Database

Trạng thái: bản đề xuất ngày 04/10/2026, CHƯA chạy SQL, CHƯA sửa Backend trong giai đoạn 4.
Database chính: library_db1. SQL đi kèm: ../database/stage4_schema_proposal.sql.
Kế hoạch theo nhóm 3A–3D và giai đoạn 4 trong chat là tiến độ hiện hành;
BACKEND_FIX_PLAN.md là bản kế hoạch cũ, chưa cập nhật đầy đủ các giai đoạn này.

## Bằng chứng và nguyên tắc

- MySQL hiện có 10 bảng; chưa có book_reviews và password_reset_tokens.
- subscription_plans, subscriptions và payments đều có 0 bản ghi tại lần kiểm tra này.
- JSON mẫu plan đầu tài liệu và LLD plan dùng hai mô hình khác nhau.
- Backend dùng planCode để tra cứu/kiểm tra trùng và dùng hạn mức plan để tạo subscription.
- Các trường trình bày/audit của plan đã đi qua DTO/mapper/service, nên loại khỏi persistence sẽ làm mất khả năng lưu hiện tại.
- Không đổi tên/xóa cột cũ, không xóa dữ liệu, không dùng ddl-auto=update.

## 4A — Plan và cách biểu diễn tiền

Giữ title, duration_in_days, active, price DECIMAL(10,2) và mọi cột hiện có.
Backend tiếp tục map name/title, durationDays/duration_in_days, isActive/active.

Bổ sung 10 cột:

| Cột | Kiểu | Mục đích |
|---|---|---|
| plan_code | VARCHAR(100), NOT NULL, UNIQUE | Mã gói được repository và payment sử dụng |
| currency | VARCHAR(3), NOT NULL, default VND | Tiền tệ đã được người dùng chọn |
| max_books_allowed | INT, NOT NULL, >0 | Hạn mức số sách |
| max_days_per_book | INT, NOT NULL, >0 | Hạn ngày mượn |
| display_order | INT, NOT NULL, default 0 | Thứ tự hiển thị hiện có |
| is_featured | BOOLEAN, NOT NULL, default false | Cờ nổi bật hiện có |
| badge_text | VARCHAR(255), NULL | Nhãn gói hiện có |
| admin_notes | VARCHAR(255), NULL | Ghi chú quản trị hiện có |
| created_by | VARCHAR(150), NULL | Audit đang được service gán |
| updated_by | VARCHAR(150), NULL | Audit đang được service gán |

Không tái sử dụng max_users_allowed cho hạn mức sách: ý nghĩa khác nhau.
Không nhét các trường trên vào features JSON: sẽ thay đổi cấu trúc dữ liệu và query hiện tại nhiều hơn việc bổ sung cột rõ nghĩa.

SQL này chỉ phù hợp khi bảng plan còn rỗng. Nếu có dữ liệu mới trước lúc thực thi,
dừng và chuyển sang thêm cột nullable, backfill theo dữ liệu được duyệt, kiểm tra rồi mới siết NOT NULL/UNIQUE.
Không tự gán hạn mức hoặc mã gói cho dữ liệu cũ.

Thay đổi Backend dự kiến theo yêu cầu mới: VND, loại Razorpay và thay bằng VNPAY hoặc VietQR.
Đề xuất chọn VNPAY, chờ người dùng chốt cổng trước khi triển khai tích hợp:

- SubscriptionPlan và SubscriptionPlanDTO: price dùng BigDecimal, giữ nguyên DECIMAL trong DB.
- Đề xuất toàn bộ giá trị tiền nghiệp vụ lưu theo đồng VND: plan.price DECIMAL có phần lẻ .00, subscriptions.price/payments.amount/fines.amount/amount_paid là số nguyên đồng.
- Từ chối số tiền lẻ dưới một đồng; kiểm tra tràn số, không làm tròn ngầm.
- Nếu chọn VNPAY, chỉ nhân 100 khi tạo vnp_Amount theo giao thức của cổng. Ví dụ DB 100000 VND -> vnp_Amount=10000000; khi nhận callback đối chiếu với số tiền DB theo cùng quy tắc. Không nhân 100 trước khi lưu DB.
- Truyền currency từ plan sang subscription/payment; mapper không bỏ qua currency.
- Người dùng đã chọn VND và cho phép thay Razorpay. Không cần xác nhận lại tiền tệ. Không tự chuyển đổi giá trị hoặc đổi nhãn giao dịch INR cũ; kiểm tra dữ liệu trước khi chạy SQL.
- Đổi default payments.currency sang VND chỉ áp dụng mặc định cho bản ghi mới, không UPDATE dữ liệu cũ.
- Thay dependency/config/service/DTO có tên Razorpay theo cổng được chốt; credentials lấy từ biến môi trường.
- Với VNPAY: tạo URL có chữ ký; xử lý IPN kiểm tra chữ ký, merchant, mã giao dịch, số tiền, tiền tệ và trạng thái; cập nhật payment/quyền lợi một lần trong transaction. Return URL chỉ phục vụ hiển thị, không tự kích hoạt quyền lợi theo dữ liệu trình duyệt.
- Cần TmnCode/HashSecret sandbox và URL IPN truy cập được để kiểm thử end-to-end; không yêu cầu gửi khóa bí mật trong chat.
- VietQR chỉ tạo QR không đủ xác minh nhận tiền. Nếu chọn VietQR phải chốt nhà cung cấp API callback/đối soát trước; không tự đánh dấu thanh toán thành công sau khi tạo QR.

Nguồn kỹ thuật: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html và https://vietqr.io/intro/.

## 4B — Hai bảng cho chức năng đã có

- book_reviews: ID tự tăng, FK user/book, rating, review_text, title, timestamp; unique user/book theo điều kiện service đã có.
- password_reset_tokens: ID tự tăng, token unique, FK user, expiry_date.
- Không cascade delete, không thay đổi/xóa dữ liệu bảng cha.
- Backend BookReview/PasswordResetToken phải map đúng tên bảng, IDENTITY, FK, tên và độ dài cột.
- Không bổ sung helpful vote hoặc chức năng review khác chưa triển khai; không đổi hard/soft delete trong nhóm schema này.
- ALTER TABLE không tạo được bảng còn thiếu; CREATE TABLE bổ sung hai bảng không phải tạo lại database.

## 4C — CHECK trạng thái payment

Đề xuất mở rộng chk_payments_status thêm PROCESSING vì tài liệu và service đều có trạng thái này.
Giữ nguyên bốn giá trị cũ; không thêm REFUNDED khi chưa có luồng refund được xác minh.
Enum REFUNDED hiện có sẽ được ghi rõ là chưa được hỗ trợ lưu trong phạm vi hiện tại.
Thay CHECK trong cùng một ALTER, không có khoảng trống giữa hai lệnh riêng rẽ.

## Thực thi và kiểm chứng sau phê duyệt

1. Xác nhận phạm vi SQL và lựa chọn tiền tệ/đơn vị tiền.
2. Kiểm tra lại schema, số bản ghi, cấu hình kết nối; sao lưu trước DDL.
3. Chạy từng nhóm SQL đã duyệt, kiểm tra SHOW CREATE TABLE sau mỗi nhóm.
4. Sửa Backend tương ứng theo từng nhóm; build và test sau mỗi nhóm.
5. Chạy SubscriptionPaymentMappingIT với validate, mở rộng kiểm tra hai bảng mới.
6. Chạy startup với initializer tắt và ddl-auto=validate. Ghi rõ lỗi query/bean/service còn lại, không tuyên bố mọi API đã hoạt động chỉ vì mapping qua.
7. Kiểm thử ghi/update/delete là nhóm riêng cần phương án dữ liệu thử trước khi chạy.

MySQL DDL có implicit commit, không dựa vào ROLLBACK để hoàn tác ALTER/CREATE.
Nếu gặp lỗi sau một nhóm, dừng, kiểm tra trạng thái thực tế; không chạy lại cả script,
không tự DROP các bảng/cột đã thêm. Bản đề xuất không có dữ liệu seed hoặc tài khoản admin.
