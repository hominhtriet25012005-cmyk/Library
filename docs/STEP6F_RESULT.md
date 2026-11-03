# 6F — Subscription, Fine, Payment

Cập nhật 05/10/2026. Chỉ xử lý backend; không thay đổi schema MySQL, không bật payOS và không thực hiện giao dịch thật.

## Thay đổi

| File | Nội dung |
|---|---|
| `Library/src/main/java/com/library/controller/SubscriptionController.java` | Chuẩn hóa payOS chưa khả dụng thành HTTP 503; request không hợp lệ 400, không đủ quyền 403. |
| `Library/src/main/java/com/library/controller/PaymentController.java` | Chặn page âm, size ngoài 1–100 và trường sort không cho phép trước khi truy vấn admin history. |
| `Library/src/main/java/com/library/service/impl/FineServiceImpl.java` | Loan/fine không tồn tại trả lỗi client 4xx; miễn fine đã miễn/đã thanh toán trả lỗi trạng thái 409 thay vì lỗi 500. |
| `Library/src/test/java/com/library/Step6ApiMySqlIT.java` | Bổ sung test tham chiếu fine sai, miễn lặp, admin payment history/paging và đầu vào page/size/sort. |
| `docs/STEP6_TRACEABILITY.md` | Cập nhật kết quả F-01…F-07 và giới hạn nghiệm thu. |

## Kiểm chứng

- 12/12 API test 6F đạt trên MySQL `library_db1`, Hibernate `ddl-auto=validate`; fixtures rollback và có safety guard DB trống.
- `mvn clean package`: **BUILD SUCCESS**, 72/72 regression test. Có cảnh báo Lombok builder và Mockito dynamic-agent cũ, không làm test thất bại.
- JDBC diagnostic chỉ đọc sau kiểm tra: DB `library_db1`, session `read_only=1`, 12 bảng hiện hữu đều 0 dòng. Không có DDL/DML từ thao tác 6F.
- JAR `Library/target/Library-0.0.1-SNAPSHOT.jar`, SHA-256 `E69439C6F90868C2CB1B20F867BE60651C73622C8F52CEB9B030911029869BF6`.

### Lưu ý baseline và giới hạn

Trước sửa, chạy toàn bộ `Step6ApiMySqlIT` có 99 test, 3 failure + 2 error; trong phạm vi 6F, `disabledSubscribeControlledUnavailableWithoutDraft` bị ném exception thay vì trả HTTP response và đã được sửa. Các ca đỏ ngoài phạm vi gồm phân quyền `/api/users/list`, ẩn password trong profile, hai assertion constraint MySQL (`UncategorizedSQLException` khác kiểu wrapper mong đợi), và advanced search null-page. Các lỗi này không được sửa trong 6F.

Không gọi payOS thật, không nhận webhook public, không gửi email, không xác minh tiền vào ngân hàng. Vì vậy 6F xác nhận luồng backend/offline và API MySQL được thử bằng fixtures; chưa chứng minh thanh toán thực tế hoặc vận hành webhook HTTPS. Không sửa dữ liệu người dùng hay schema.
