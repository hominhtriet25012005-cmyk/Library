# Từ điển dữ liệu Database

> Diễn giải các cột trong [`library_db1.sql`](library_db1.sql), schema chuẩn của Project. Kiểu dữ liệu theo khai báo SQL. Danh sách gồm 17 bảng.

## 1. `users` — Tài khoản

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã tài khoản, khóa chính tự tăng. |
| `full_name` | VARCHAR(255) | Họ tên hiển thị. |
| `password` | VARCHAR(255) | Mật khẩu đã được Backend băm. |
| `email` | VARCHAR(255) | Email đăng nhập duy nhất. |
| `phone` | VARCHAR(30) | Số điện thoại, có thể trống. |
| `profile_image` | VARCHAR(500) | Đường dẫn ảnh hồ sơ, có thể trống. |
| `role` | VARCHAR(20) | Vai trò `ROLE_USER` hoặc `ROLE_ADMIN`. |
| `verified` | BOOLEAN | Email đã xác minh hay chưa. |
| `created_at` | DATETIME | Thời điểm tạo tài khoản. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |
| `last_login` | DATETIME | Lần đăng nhập gần nhất, có thể trống. |

## 2. `email_verification_tokens` — Mã xác minh email

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã bản ghi, khóa chính tự tăng. |
| `user_id` | BIGINT | Tài khoản sở hữu mã; FK đến `users.id`. |
| `token_hash` | CHAR(64) | Bản băm của mã; không lưu mã gốc. |
| `expires_at` | DATETIME | Thời điểm mã hết hạn. |
| `consumed_at` | DATETIME | Thời điểm mã được dùng thành công; có thể trống. |
| `revoked_at` | DATETIME | Thời điểm mã bị thu hồi; có thể trống. |
| `created_at` | DATETIME | Thời điểm tạo mã. |

## 3. `user_notification_preferences` — Tùy chọn email

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `user_id` | BIGINT | Tài khoản; khóa chính và FK đến `users.id`. |
| `email_due_reminder` | BOOLEAN | Cho phép email nhắc sắp đến hạn trả. |
| `email_overdue_alert` | BOOLEAN | Cho phép email báo mượn quá hạn. |
| `email_reservation_updates` | BOOLEAN | Cho phép email cập nhật đặt giữ. |
| `email_membership_updates` | BOOLEAN | Cho phép email cập nhật gói thành viên. |
| `email_general_announcements` | BOOLEAN | Cho phép email thông báo chung. |
| `email_admin_return_requests` | BOOLEAN | Cho phép email báo ADMIN yêu cầu trả cần xử lý. |
| `created_at` | DATETIME | Thời điểm tạo bộ tùy chọn. |
| `updated_at` | DATETIME | Thời điểm thay đổi gần nhất. |

## 4. `notifications` — Thông báo trong Website

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã thông báo, khóa chính tự tăng. |
| `recipient_user_id` | BIGINT | Tài khoản nhận; FK đến `users.id`. |
| `created_by_user_id` | BIGINT | Tài khoản tạo thông báo nếu có; có thể trống. |
| `event_type` | VARCHAR(50) | Mã loại sự kiện nghiệp vụ. |
| `title` | VARCHAR(200) | Tiêu đề hiển thị. |
| `message` | VARCHAR(2000) | Nội dung thông báo. |
| `action_url` | VARCHAR(500) | Đường dẫn xem/thao tác, có thể trống. |
| `source_type` | VARCHAR(50) | Loại bản ghi nguồn phát sinh thông báo. |
| `source_id` | BIGINT | Mã bản ghi nguồn, có thể trống. |
| `batch_key` | VARCHAR(191) | Khóa gom nhóm thông báo gửi theo đợt. |
| `deduplication_key` | VARCHAR(191) | Khóa duy nhất để tránh tạo thông báo trùng. |
| `read_at` | DATETIME | Thời điểm đọc; trống nghĩa là chưa đọc. |
| `created_at` | DATETIME | Thời điểm tạo thông báo. |

## 5. `email_outbox` — Hàng đợi gửi email

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã email, khóa chính tự tăng. |
| `recipient_user_id` | BIGINT | Tài khoản nhận nếu còn liên kết tài khoản. |
| `notification_id` | BIGINT | Thông báo Website liên quan nếu có. |
| `event_type` | VARCHAR(50) | Mã sự kiện tạo email. |
| `recipient_email` | VARCHAR(255) | Địa chỉ nhận tại lúc xếp hàng. |
| `subject` | VARCHAR(255) | Tiêu đề email. |
| `body_html` | LONGTEXT | Nội dung email HTML. |
| `status` | VARCHAR(20) | Trạng thái gửi/xử lý email. |
| `attempt_count` | INT | Số lần đã thử gửi. |
| `max_attempts` | INT | Số lần thử tối đa. |
| `next_attempt_at` | DATETIME | Thời điểm có thể thử gửi tiếp. |
| `locked_at` | DATETIME | Thời điểm worker khóa để xử lý. |
| `locked_by` | VARCHAR(100) | Mã worker xử lý, có thể trống. |
| `last_attempt_at` | DATETIME | Thời điểm thử gửi gần nhất. |
| `sent_at` | DATETIME | Thời điểm gửi thành công. |
| `last_error` | VARCHAR(1000) | Lỗi gửi gần nhất nếu có. |
| `deduplication_key` | VARCHAR(191) | Khóa chống xếp cùng email nhiều lần. |
| `created_at` | DATETIME | Thời điểm thêm vào hàng đợi. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |

## 6. `genres` — Thể loại sách

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã thể loại, khóa chính tự tăng. |
| `code` | VARCHAR(50) | Mã thể loại duy nhất. |
| `name` | VARCHAR(100) | Tên thể loại. |
| `description` | VARCHAR(500) | Mô tả, có thể trống. |
| `display_order` | INT | Thứ tự hiển thị. |
| `active` | BOOLEAN | Thể loại còn được dùng hay không. |
| `parent_genre_id` | BIGINT | Thể loại cha; FK tự tham chiếu, có thể trống. |
| `created_at` | DATETIME | Thời điểm tạo. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |

## 7. `books` — Đầu sách và kho sách

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã đầu sách, khóa chính tự tăng. |
| `isbn` | VARCHAR(20) | ISBN, có thể trống; nếu có thì duy nhất. |
| `title` | VARCHAR(255) | Tên sách. |
| `author` | VARCHAR(255) | Tác giả. |
| `genre_id` | BIGINT | Thể loại; FK đến `genres.id`. |
| `publisher` | VARCHAR(100) | Nhà xuất bản, có thể trống. |
| `publication_date` | DATE | Ngày xuất bản cụ thể, có thể trống. |
| `publication_year` | SMALLINT UNSIGNED | Năm xuất bản nếu không lưu ngày cụ thể. |
| `language` | VARCHAR(20) | Ngôn ngữ sách. |
| `pages` | INT | Số trang. |
| `description` | VARCHAR(2000) | Nội dung giới thiệu, có thể trống. |
| `total_copies` | INT | Tổng số bản trong kho. |
| `available_copies` | INT | Số bản hiện có thể cho mượn. |
| `price` | DECIMAL(10,2) | Giá tham khảo/giá trị sách. |
| `cover_image_url` | VARCHAR(500) | Đường dẫn ảnh bìa, có thể trống. |
| `active` | BOOLEAN | Sách có hiển thị trong danh mục hay không. |
| `created_at` | DATETIME | Thời điểm tạo bản ghi. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |

## 8. `subscription_plans` — Gói thành viên mở bán

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã gói, khóa chính tự tăng. |
| `title` | VARCHAR(150) | Tên gói, không trùng. |
| `description` | VARCHAR(500) | Mô tả gói. |
| `price` | DECIMAL(10,2) | Giá gói theo `currency`. |
| `duration_in_days` | INT | Thời hạn gói tính theo ngày. |
| `billing_cycle` | VARCHAR(20) | Chu kỳ tính phí (`MONTHLY`, `YEARLY`, `ONE_TIME`). |
| `trial_days` | INT | Số ngày dùng thử nếu có; Website không bán gói miễn phí. |
| `max_users_allowed` | INT | Hạn mức số người dùng theo gói. |
| `features` | JSON | Quyền lợi cấu hình dạng JSON. |
| `auto_renew` | BOOLEAN | Gói có bật gia hạn tự động hay không. |
| `active` | BOOLEAN | Gói đang mở bán hay không. |
| `created_at` | DATETIME | Thời điểm tạo gói. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |
| `plan_code` | VARCHAR(100) | Mã gói dùng trong Backend/API. |
| `currency` | VARCHAR(3) | Mã tiền tệ; quy ước của Website là `VND`. |
| `max_books_allowed` | INT | Số sách tối đa được mượn cùng lúc. |
| `max_days_per_book` | INT | Số ngày mượn tối đa cho mỗi cuốn. |
| `display_order` | INT | Thứ tự hiển thị gói. |
| `is_featured` | BOOLEAN | Gói có được đánh dấu nổi bật không. |
| `badge_text` | VARCHAR(255) | Nhãn ngắn hiển thị trên gói. |
| `admin_notes` | VARCHAR(255) | Ghi chú nội bộ ADMIN. |
| `created_by` | VARCHAR(150) | Người tạo theo thông tin audit. |
| `updated_by` | VARCHAR(150) | Người sửa gần nhất theo thông tin audit. |

## 9. `subscriptions` — Lịch sử đăng ký gói

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã lượt đăng ký, khóa chính tự tăng. |
| `user_id` | BIGINT | Người đăng ký; FK đến `users.id`. |
| `plan_id` | BIGINT | Gói gốc; FK đến `subscription_plans.id`. |
| `plan_name` | VARCHAR(255) | Tên gói chụp tại thời điểm mua. |
| `plan_code` | VARCHAR(100) | Mã gói chụp tại thời điểm mua. |
| `price` | BIGINT | Giá đã trả, tính bằng đồng. |
| `currency` | VARCHAR(3) | Mã tiền tệ, Website dùng `VND`. |
| `start_date` | DATE | Ngày bắt đầu hiệu lực. |
| `end_date` | DATE | Ngày kết thúc hiệu lực. |
| `is_active` | BOOLEAN | Lượt đăng ký còn hiệu lực hay không. |
| `max_books_allowed` | INT | Hạn mức sách được chụp từ gói lúc mua. |
| `max_days_per_book` | INT | Hạn mức ngày mượn được chụp từ gói lúc mua. |
| `auto_renew` | BOOLEAN | Trạng thái gia hạn tự động của lượt đăng ký. |
| `cancelled_at` | DATETIME | Thời điểm hủy, có thể trống. |
| `cancellation_reason` | TEXT | Lý do hủy, có thể trống. |
| `notes` | TEXT | Ghi chú, có thể trống. |
| `created_at` | TIMESTAMP | Thời điểm tạo lượt đăng ký. |
| `updated_at` | TIMESTAMP | Thời điểm cập nhật gần nhất. |

## 10. `book_loans` — Lượt mượn và trả sách

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã lượt mượn, khóa chính tự tăng. |
| `user_id` | BIGINT | Người mượn; FK đến `users.id`. |
| `book_id` | BIGINT | Đầu sách; FK đến `books.id`. |
| `type` | VARCHAR(30) | Loại lượt mượn theo nghiệp vụ. |
| `status` | VARCHAR(30) | Trạng thái hiện tại của lượt mượn. |
| `checkout_date` | DATE | Ngày ADMIN ghi nhận giao sách. |
| `due_date` | DATE | Hạn trả sách. |
| `return_date` | DATE | Ngày ghi nhận trả/kết thúc lượt mượn, có thể trống. |
| `return_requested_at` | DATETIME | Thời điểm USER gửi yêu cầu trả. |
| `return_request_note` | VARCHAR(500) | Ghi chú gửi cùng yêu cầu trả. |
| `checked_in_at` | DATETIME | Thời điểm ADMIN nhận và kiểm tra sách. |
| `checked_in_by` | BIGINT | ADMIN check-in; FK đến `users.id`, có thể trống. |
| `inspection_note` | VARCHAR(500) | Ghi chú tình trạng sách sau kiểm tra. |
| `renewal_count` | INT | Số lần đã gia hạn. |
| `max_renewals` | INT | Số lần gia hạn tối đa được phép. |
| `notes` | VARCHAR(500) | Ghi chú nghiệp vụ khác. |
| `is_overdue` | BOOLEAN | Lượt mượn đang bị đánh dấu quá hạn hay không. |
| `overdue_days` | INT | Số ngày quá hạn được ghi nhận. |
| `created_at` | DATETIME | Thời điểm tạo lượt mượn. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |

## 11. `fines` — Khoản phạt

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã khoản phạt, khóa chính tự tăng. |
| `book_loan_id` | BIGINT | Lượt mượn phát sinh phạt; FK đến `book_loans.id`. |
| `user_id` | BIGINT | Người chịu khoản phạt; FK đến `users.id`. |
| `type` | VARCHAR(30) | Loại phạt như quá hạn, hư hỏng hoặc mất sách. |
| `amount` | BIGINT | Tổng tiền phạt tính bằng đồng. |
| `amount_paid` | BIGINT | Số tiền đã thanh toán. |
| `status` | VARCHAR(30) | Trạng thái thanh toán/xử lý khoản phạt. |
| `reason` | VARCHAR(500) | Lý do phát sinh khoản phạt. |
| `notes` | VARCHAR(1000) | Ghi chú thêm. |
| `waived_by` | BIGINT | ADMIN miễn/giảm; FK đến `users.id`, có thể trống. |
| `waived_at` | DATETIME | Thời điểm miễn/giảm, có thể trống. |
| `waiver_reason` | VARCHAR(500) | Lý do miễn/giảm. |
| `paid_at` | DATETIME | Thời điểm thanh toán xong, có thể trống. |
| `processed_by` | BIGINT | Người xử lý khoản phạt nếu có. |
| `transaction_id` | VARCHAR(100) | Mã giao dịch liên quan, có thể trống. |
| `created_at` | DATETIME | Thời điểm tạo khoản phạt. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |

## 12. `reservations` — Hàng chờ đặt giữ

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã yêu cầu đặt giữ, khóa chính tự tăng. |
| `user_id` | BIGINT | Người đặt giữ; FK đến `users.id`. |
| `book_id` | BIGINT | Đầu sách đặt giữ; FK đến `books.id`. |
| `status` | VARCHAR(30) | Trạng thái yêu cầu trong hàng chờ. |
| `reserved_at` | DATETIME | Thời điểm tạo yêu cầu. |
| `available_at` | DATETIME | Thời điểm sách được giữ sẵn. |
| `available_until` | DATETIME | Hạn cuối nhận sách đã giữ. |
| `fulfilled_at` | DATETIME | Thời điểm chuyển yêu cầu thành lượt mượn. |
| `cancelled_at` | DATETIME | Thời điểm hủy, có thể trống. |
| `queue_position` | INT | Vị trí trong hàng chờ. |
| `notification_sent` | BOOLEAN | Đã thông báo sách sẵn sàng hay chưa. |
| `notes` | TEXT | Ghi chú thêm. |
| `created_at` | TIMESTAMP | Thời điểm tạo bản ghi. |
| `updated_at` | TIMESTAMP | Thời điểm cập nhật gần nhất. |

## 13. `wishlists` — Sách yêu thích

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã mục yêu thích, khóa chính tự tăng. |
| `user_id` | BIGINT | Người lưu; FK đến `users.id`. |
| `book_id` | BIGINT | Sách được lưu; FK đến `books.id`. |
| `added_at` | DATETIME | Thời điểm thêm vào danh sách. |
| `notes` | VARCHAR(500) | Ghi chú riêng của người dùng. |

## 14. `book_reviews` — Đánh giá sách

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã đánh giá, khóa chính tự tăng. |
| `user_id` | BIGINT | Người đánh giá; FK đến `users.id`. |
| `book_id` | BIGINT | Sách được đánh giá; FK đến `books.id`. |
| `rating` | INT | Số sao từ 1 đến 5. |
| `review_text` | VARCHAR(2000) | Bình luận; có thể trống nếu chỉ chấm sao. |
| `is_anonymous` | BOOLEAN | Có ẩn danh tính trên giao diện công khai hay không. |
| `title` | VARCHAR(200) | Tiêu đề đánh giá, có thể trống. |
| `is_active` | BOOLEAN | Đánh giá đang hiển thị hay đã ẩn. |
| `created_at` | DATETIME | Thời điểm gửi đánh giá. |
| `updated_at` | DATETIME | Thời điểm cập nhật gần nhất. |

## 15. `password_reset_tokens` — Mã đặt lại mật khẩu

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã bản ghi, khóa chính tự tăng. |
| `token` | VARCHAR(255) | Mã xác thực yêu cầu đặt lại mật khẩu. |
| `user_id` | BIGINT | Tài khoản cần đặt lại mật khẩu; FK đến `users.id`. |
| `expiry_date` | DATETIME | Thời điểm mã hết hạn. |

## 16. `payments` — Thanh toán

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | BIGINT | Mã thanh toán nội bộ, khóa chính tự tăng. |
| `user_id` | BIGINT | Người thanh toán; FK đến `users.id`. |
| `book_loan_id` | BIGINT | Lượt mượn liên quan khoản phạt; có thể trống. |
| `subscription_id` | BIGINT | Lượt đăng ký gói liên quan; có thể trống. |
| `fine_id` | BIGINT | Khoản phạt liên quan; có thể trống. |
| `payment_type` | VARCHAR(30) | Loại thanh toán `MEMBERSHIP` hoặc `FINE`. |
| `status` | VARCHAR(30) | Trạng thái nội bộ giao dịch. |
| `gateway` | VARCHAR(30) | Cổng thanh toán, hiện dùng `PAYOS`. |
| `amount` | BIGINT | Số tiền giao dịch tính bằng đồng. |
| `currency` | VARCHAR(3) | Mã tiền tệ; Website dùng `VND`. |
| `transaction_id` | VARCHAR(255) | Mã giao dịch để đối soát nếu có. |
| `gateway_payment_id` | VARCHAR(255) | Mã thanh toán do cổng trả về. |
| `gateway_order_id` | VARCHAR(255) | Mã đơn gửi đến cổng thanh toán. |
| `gateway_signature` | VARCHAR(500) | Chữ ký callback/xác thực nếu được lưu. |
| `payment_method` | VARCHAR(100) | Phương thức do cổng thanh toán ghi nhận. |
| `metadata` | JSON | Dữ liệu phụ của giao dịch. |
| `description` | TEXT | Mô tả giao dịch. |
| `failure_reason` | TEXT | Lý do thất bại nếu có. |
| `retry_count` | INT | Số lần thử/đối soát lại. |
| `initiated_at` | DATETIME | Thời điểm khởi tạo. |
| `completed_at` | DATETIME | Thời điểm giao dịch kết thúc. |
| `notification_sent` | BOOLEAN | Cờ đã xử lý thông báo liên quan giao dịch. |
| `active` | BOOLEAN | Giao dịch được xem là đang hoạt động hay không. |
| `created_at` | TIMESTAMP | Thời điểm tạo bản ghi. |
| `updated_at` | TIMESTAMP | Thời điểm cập nhật gần nhất. |

## 17. `lr_schema_migrations` — Dấu mốc chuyển đổi

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `version` | VARCHAR(100) | Mã duy nhất của lần chuyển đổi đã áp dụng; khóa chính. |
| `applied_at` | TIMESTAMP | Thời điểm ghi nhận chuyển đổi. |

## Quan hệ khóa ngoại chính

- `email_verification_tokens`, `user_notification_preferences`, `notifications`, `email_outbox`, `subscriptions`, `book_loans`, `fines`, `reservations`, `wishlists`, `book_reviews`, `password_reset_tokens` và `payments` liên kết tới `users`.
- `books.genre_id` liên kết `genres.id`; `genres.parent_genre_id` tự liên kết để tạo thể loại cha/con.
- `subscriptions.plan_id` liên kết `subscription_plans.id`; bản đăng ký đồng thời lưu ảnh chụp tên, mã và hạn mức gói.
- `book_loans.book_id` liên kết `books.id`; `fines.book_loan_id` liên kết `book_loans.id`.
- `reservations.book_id`, `wishlists.book_id` và `book_reviews.book_id` liên kết `books.id`.
- `payments` tham chiếu mục tiêu theo loại thanh toán; CHECK giới hạn hình dạng mục tiêu, còn quyền sở hữu và đối chiếu chéo được Backend kiểm tra.

## Cách đọc kiểu dữ liệu

`NULL` nghĩa là giá trị có thể chưa có; `BOOLEAN` là đúng/sai; `JSON` lưu dữ liệu có cấu trúc; `DATE` lưu ngày; `DATETIME`/`TIMESTAMP` lưu ngày giờ. `created_at` và `updated_at` là thời điểm kỹ thuật, không thay cho ngày mượn/trả nghiệp vụ.
