# Kiểm tra schema MySQL và startup sau C2

Ngày 04/10/2026, khoảng 18:34–18:36 (Asia/Saigon). Kết luận: **kết nối MySQL thành công; startup chưa thành công; chưa sẵn sàng thử thanh toán thật**.

## Phạm vi an toàn

- Đọc trực tiếp `library_db1` tại localhost:3306, MySQL 9.2.0. Diagnostic xác nhận `@@session.transaction_read_only = 1`.
- Đọc SHOW CREATE TABLE, số lượng bản ghi và chạy hai bài kiểm tra mapping hiện có. Không INSERT/UPDATE/DELETE/ALTER/CREATE trên MySQL.
- Startup dùng `ddl-auto=validate`, SQL init tắt, admin initializer tắt, payOS và tạo thanh toán tắt. Hikari read-only, driver sessionVariables `transaction_read_only=ON`. Bind loopback cổng ngẫu nhiên; ứng dụng tự đóng Hikari/Tomcat sau lỗi startup, tiến trình kết thúc exit 1.
- Không sửa code sản phẩm hoặc application.properties. Chỉ thêm tiện ích chẩn đoán `database/SchemaReadOnlyCheck.java` và báo cáo này. Không chạy `stage4_schema_proposal.sql`.
- Áp dụng systematic-debugging và verification-before-completion: kết luận từ schema live, kết quả test và log startup, không dựa riêng vào tài liệu/SQL cũ.

## Bằng chứng

Database có 10 bảng, tất cả COUNT(*) = 0 tại thời điểm kiểm tra: users, genres, books, book_loans, fines, reservations, wishlists, subscription_plans, subscriptions, payments.

| Kiểm tra | Kết quả |
|---|---|
| JDBC trực tiếp | Kết nối thành công; đúng library_db1; MySQL 9.2.0; transaction chỉ đọc |
| CatalogMappingIT | 5 tests qua; validate và SELECT trên user/catalog/loan/fine/reservation/wishlist không lỗi |
| SubscriptionPaymentMappingIT | 1 test lỗi: `Schema validation: missing column [admin_notes] in table [subscription_plans]` |
| Spring Boot thực tế | Hikari start completed, nhận JDBC metadata MySQL; EntityManagerFactory lỗi `Schema validation: missing table [book_review_seq]` |
| Toàn ứng dụng/API/security runtime | Chưa xác nhận: context dừng trước khi hoàn tất startup; Tomcat initialized không đồng nghĩa app đã sẵn sàng |

Bảng rỗng nên SELECT chỉ chứng minh query/mapping chạy được, không chứng minh mọi giá trị dữ liệu, thao tác ghi hoặc business rule hoạt động. Hibernate validate dừng ở lỗi đầu, không kiểm tra đầy đủ CHECK/default/FK; phần dưới đối chiếu thêm DDL live và entity.

Ghi chú thao tác: lần startup đầu có lỗi SQL 1064 do tham số chẩn đoán `connection-init-sql` chứa khoảng trắng bị Maven tách. Đã bỏ tham số đó, dùng sessionVariables không chứa khoảng trắng và tắt DevTools restart, rồi chạy lại. Không coi lỗi 1064 đó là lỗi sản phẩm; kết luận startup lấy từ lần chạy lại có Hikari kết nối thành công và lỗi book_review_seq. Lần đầu Maven in BUILD SUCCESS dù context lỗi do DevTools; không dùng dòng này làm bằng chứng startup thành công.

## Vấn đề xác nhận và hướng sửa

| Priority | Component | File/Table | Problem | Cause | Proposed Fix |
|---|---|---|---|---|---|
| CRITICAL | ID generation | modal/BookReview.java; modal/PasswordResetToken.java | Startup đòi book_review_seq; cả hai entity dùng AUTO | Chưa map chiến lược ID phù hợp AUTO_INCREMENT của thiết kế MySQL | Sửa Backend sang IDENTITY; không tạo thêm bảng sequence chỉ để né lỗi |
| CRITICAL | Thiếu nơi lưu dữ liệu | BookReview/PasswordResetToken; schema library_db1 | Không có bảng review hoặc reset token dưới tên số ít hay số nhiều | Database 10 bảng chưa bao phủ hai chức năng đã tồn tại trong Backend | Bổ sung riêng book_reviews/password_reset_tokens; đồng thời map @Table, FK và độ dài cột chính xác. Không tạo lại schema |
| CRITICAL | Plan mapping | SubscriptionPlan; subscription_plans | Thiếu 10 cột entity đang sử dụng | SQL ban đầu mô tả plan khác mô hình Backend | ALTER bổ sung cột, giữ title/duration_in_days/price/active và mọi cột hiện có |
| HIGH | Payment trạng thái | PayOSOrderStore.attachLink; payments.chk_payments_status | Code ghi PROCESSING nhưng CHECK chỉ nhận PENDING/SUCCESS/FAILED/CANCELLED | CHECK cũ thiếu trạng thái trung gian | Mở rộng CHECK thêm PROCESSING, giữ nguyên bốn giá trị cũ; không ghi thử để gây lỗi trên DB |
| MEDIUM | Default tiền tệ | payments.currency | SQL default INR, Java và payOS dùng VND | Default cũ còn sau khi thay gateway | Đề xuất default VND cho bản ghi mới; không UPDATE dữ liệu cũ. Không phải lỗi chặn luồng payOS hiện tại vì code truyền VND rõ ràng |
| LOW | Enum chưa hỗ trợ | PaymentStatus.REFUNDED | Enum có REFUNDED nhưng CHECK không có | Chưa có luồng refund được triển khai | Ghi nhận giới hạn; không tự thêm refund hoặc nới CHECK cho trạng thái không dùng |

10 cột thiếu trong subscription_plans:

`plan_code`, `currency`, `max_books_allowed`, `max_days_per_book`, `display_order`, `is_featured`, `badge_text`, `admin_notes`, `created_by`, `updated_by`.

### Bên nào thực sự cần thay đổi?

- **Backend cần sửa** BookReview và PasswordResetToken: IDENTITY, tên bảng rõ ràng; BookReview.reviewText hiện mặc định VARCHAR(255), trong khi request/DTO hỗ trợ đến 2000, title hỗ trợ 200. Cần đồng bộ mapping với thiết kế bảng bổ sung. Chỉ tạo bảng theo proposal cũ mà không sửa hai entity này vẫn không đủ.
- **Database cần bổ sung** dữ liệu mà Backend hiện đang lưu nhưng schema không có. Xóa entity/đặt @Transient/bỏ repository chỉ để startup qua sẽ làm mất tính năng review/reset mật khẩu hoặc dữ liệu plan. Tái dùng bảng khác không cùng ý nghĩa sẽ thành redesign.
- Các hạn mức `max_books_allowed` và `max_days_per_book` không tương đương `max_users_allowed`; không đổi tên cột để đánh tráo ý nghĩa. Repository dùng planCode; service/mapper dùng các trường audit/trình bày. Loại chúng khỏi persistence sẽ thay đổi chức năng hiện có.
- Có thể giữ PENDING sau khi tạo QR để né CHECK, nhưng đó là thay đổi mô hình trạng thái đang dùng trong Backend/tài liệu. Với yêu cầu giữ logic hiện tại, mở rộng CHECK thêm PROCESSING là thay đổi nhỏ hơn và rõ nghĩa hơn.
- Không cần thay đổi bảng users/books/genres/loans/fines/reservations/wishlists theo kết quả kiểm tra hiện tại. Các FK hiện có của payments tới user/loan/subscription/fine đúng bảng/cột id BIGINT. Không đề xuất đổi cascade hay xóa cột SQL không được entity dùng: cột dư nullable/có default không tự gây lỗi.

## SQL tối thiểu đề xuất — CHƯA thực thi

### Nhóm 1: Plan (bảng đang rỗng)

Giữ tất cả cột và ràng buộc hiện có. Kiểm tra COUNT(*) lại trước DDL; nếu bảng có dữ liệu mới, dừng để lập phương án backfill được duyệt, không tự gán mã/hạn mức.

```sql
ALTER TABLE library_db1.subscription_plans
    ADD COLUMN plan_code VARCHAR(100) NOT NULL,
    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    ADD COLUMN max_books_allowed INT NOT NULL,
    ADD COLUMN max_days_per_book INT NOT NULL,
    ADD COLUMN display_order INT NOT NULL DEFAULT 0,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN badge_text VARCHAR(255) NULL,
    ADD COLUMN admin_notes VARCHAR(255) NULL,
    ADD COLUMN created_by VARCHAR(150) NULL,
    ADD COLUMN updated_by VARCHAR(150) NULL,
    ADD CONSTRAINT uq_subscription_plans_plan_code UNIQUE (plan_code);
```

Đây là nhóm tối thiểu để giữ các field persistent và unique mà entity yêu cầu. Hai CHECK hạn mức dương trong proposal stage4 có thể duyệt bổ sung để bảo vệ quy tắc đã có; không bắt buộc chỉ để Hibernate validate qua. Giữ price DECIMAL(10,2), Backend hiện đã dùng BigDecimal.

### Nhóm 2: Payment CHECK; default tiền tệ duyệt riêng

```sql
ALTER TABLE library_db1.payments
    DROP CHECK chk_payments_status,
    ADD CONSTRAINT chk_payments_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'));
```

Chỉ thay CHECK trong cùng ALTER, không DROP TABLE và không xóa bản ghi. Mọi trạng thái cũ vẫn được chấp nhận.

```sql
-- Khuyến nghị đồng bộ default; không phải điều kiện bắt buộc của payOS hiện tại.
ALTER TABLE library_db1.payments
    ALTER COLUMN currency SET DEFAULT 'VND';
```

### Nhóm 3: Review/reset-token

Không thể dùng ALTER để bổ sung một bảng chưa tồn tại. Đề xuất hai CREATE TABLE bổ sung trong phần **4B** của `database/stage4_schema_proposal.sql`, kèm sửa mapping Backend nêu trên. Chưa chạy SQL; không tạo book_review_seq/password_reset_token_seq. Đây là bổ sung nơi lưu hai chức năng đang có, không tạo lại database. Chỉ duyệt/chạy từng nhóm, không chạy toàn file proposal vì các nhóm trước có thể đã được áp dụng.

## Thứ tự đề xuất để người dùng kiểm soát

1. Duyệt nhóm plan: backup, preflight bảng rỗng, ALTER cần thiết, chạy lại SubscriptionPaymentMappingIT.
2. Duyệt hai bảng review/reset và sửa mapping Backend tương ứng, build + validate toàn ứng dụng.
3. Duyệt CHECK payment và tùy chọn default VND, kiểm tra lại DDL.
4. Startup lại read-only với payOS tắt; chỉ sau khi startup/mapping qua mới lên kế hoạch API có dữ liệu thử và webhook/giao dịch thật.

Hiện chưa thực thi nhóm sửa nào. MySQL DDL có implicit commit: cần backup trước khi thực hiện và không coi ROLLBACK là phương án hoàn tác ALTER/CREATE. Không thể xác nhận tất cả bean/query/security runtime đã hoạt động trước khi vượt qua các lỗi schema trên.

## Lệnh tái kiểm tra

```text
java --class-path <mysql-connector-j-9.7.0.jar> database/SchemaReadOnlyCheck.java Library/src/main/resources/application.properties
mvn -o -Dmaven.repo.local=C:\Users\APC\.m2\repository -Dtest=CatalogMappingIT,SubscriptionPaymentMappingIT test
```

Startup đã chạy bằng Maven cache với JVM `-Dspring.devtools.restart.enabled=false` và các arguments:

```text
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

Không đưa credentials vào dòng lệnh/báo cáo. Diagnostic đọc cấu hình tại máy và chỉ chấp nhận URL library_db1 đã kiểm tra.
