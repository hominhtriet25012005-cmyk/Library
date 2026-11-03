# BE-5 — Test infrastructure

Ngày triển khai: 02/11/2026.

## Kết quả

BE-5 tách rõ ba tầng kiểm thử và không còn cho integration test tự rơi về database chính `library_db1`:

1. `mvn test` chỉ chạy unit/context test (`*Test`, `*Tests`, `*TestCase`) trên H2 cô lập;
2. `mvn verify -Pmysql-contract` chạy các bài đọc metadata, Hibernate `validate` và contract trên MySQL test;
3. `mvn verify -Pmysql-e2e` chạy các bài ghi/rollback, committed race và live HTTP trên MySQL test rỗng.

Mọi bài MySQL bắt buộc nhận `TEST_DB_URL`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`. Tên database trong URL phải kết thúc bằng `_test`; nếu URL trỏ `library_db1` hoặc database khác không có hậu tố này, suite dừng trước khi tạo fixture.

## Cấu hình database thử nghiệm

Database đề xuất: `library_db1_test`. Không dùng `library_db1` và không dùng dữ liệu thật.

Trong MySQL Workbench:

1. tạo schema rỗng `library_db1_test` với `utf8mb4_0900_ai_ci`;
2. mở [database/library_db1.sql](../database/library_db1.sql) trong một tab tạm, không lưu thành file schema thứ hai;
3. trong tab tạm, đổi đúng hai chỗ `CREATE DATABASE ... library_db1` và `USE library_db1` thành `library_db1_test`;
4. chạy tab tạm và xác nhận 12 bảng đều rỗng trước khi chạy profile `mysql-e2e`.

`library_db1.sql` vẫn là nguồn schema duy nhất trong repository. Database `_test` chỉ là môi trường chạy test, không phải file schema thứ hai.

Thiết lập PowerShell cho cửa sổ hiện tại:

```powershell
$env:TEST_DB_URL = "jdbc:mysql://127.0.0.1:3306/library_db1_test"
$env:TEST_DB_USERNAME = "root"
$env:TEST_DB_PASSWORD = "<mật khẩu MySQL test>"
```

Không ghi mật khẩu thật vào `pom.xml`, `application.properties`, README hoặc Git.

## Lệnh nghiệm thu

Tại thư mục `Library`:

```powershell
# Unit, service, security, H2 atomicity và context startup
.\mvnw.cmd test

# Schema contract + Hibernate validate + truy vấn đọc MySQL
.\mvnw.cmd verify -Pmysql-contract

# API/transaction/race/live HTTP; chỉ chạy trên database _test rỗng
.\mvnw.cmd verify -Pmysql-e2e
```

`mysql-e2e` cố ý từ chối chạy nếu một trong 12 bảng ứng dụng đã có dữ liệu. Các fixture committed dùng ID/tên riêng và được xóa ở `@AfterEach`, nhưng database test rỗng vẫn là điều kiện an toàn bắt buộc.

## Thay đổi kỹ thuật

- `src/test/resources/application.properties`: datasource H2 mặc định, tắt payOS và khởi tạo ADMIN;
- `pom.xml`: Surefire chạy test nhanh mặc định; Failsafe có hai profile MySQL rõ ràng;
- `MySqlTestDatabase`: đọc biến môi trường, kiểm tra JDBC MySQL URL và chặn database không có hậu tố `_test`;
- `MySqlSpringIntegrationTest`: đưa datasource test vào Spring bằng `@DynamicPropertySource`;
- mapping `publication_year` dùng JDBC `SMALLINT` thay vì nhúng DDL MySQL `SMALLINT UNSIGNED`, nên H2 dựng schema được trong khi MySQL vẫn validate với cột `SMALLINT UNSIGNED` hiện có;
- các test lỗi thời được đồng bộ với quy tắc đã chốt: trang sách mặc định 20, thông báo nghiệp vụ bằng tiếng Việt, lượt đặt giữ vẫn ở `AVAILABLE` khi thao tác fulfill bị rollback hoặc bị từ chối quyền.

## Bằng chứng hiện tại

- `mvn test`: đạt toàn bộ **166/166** test sau khi đồng bộ bốn kỳ vọng cũ;
- test an toàn MySQL được bổ sung thêm một ca kiểm tra hậu tố `_test` sau lượt full suite và được chạy lại ở lượt nghiệm thu cuối;
- context startup dùng H2 `library_unit_test`, không còn yêu cầu MySQL chính cho test mặc định;
- chưa chạy hai profile MySQL vì máy hiện chưa cấu hình `TEST_DB_URL` và `TEST_DB_USERNAME`.

Vì chưa có `library_db1_test`, BE-5 được xem là **đã hoàn thiện hạ tầng và unit baseline**, chưa đóng nghiệm thu MySQL contract/E2E. Không có dữ liệu trong `library_db1` bị đọc hoặc ghi ở lượt triển khai này.
