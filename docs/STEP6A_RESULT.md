# 6A — Auth/User, Catalog, Wishlist, Plan và thống kê

Cập nhật 05/10/2026, 21:12 (Asia/Saigon). Chỉ sửa Backend trong phạm vi lỗi/test đã xác nhận; giữ schema và business rule ngoài lựa chọn quyền xem user list.

## Đã triển khai

| File | Thay đổi |
|---|---|
| `Library/src/main/java/com/library/service/impl/BookServiceImpl.java` | Chuẩn hóa `BookSearchRequest` null và page/size/sort/availableOnly null về mặc định an toàn để body `{}` không gây NPE. |
| `Library/src/main/java/com/library/modal/User.java` | Đánh dấu password chỉ ghi để JSON serialization của profile không làm lộ password hash. |
| `Library/src/main/java/com/library/configrations/SecurityConfig.java` | GET `/api/users/list` yêu cầu ADMIN theo lựa chọn của người dùng ngày 05/10/2026. |
| `Library/src/test/java/com/library/Step6ApiMySqlIT.java` | Kiểm tra search defaults, profile không lộ hash, member/anonymous bị chặn khỏi danh sách user và admin được phép, thống kê sách trước/sau xóa mềm. |
| `docs/STEP6_TRACEABILITY.md` | Cập nhật trạng thái A-03/A-05/A-08 và điều kiện còn mở của 6A. |
| `Library/README.md` | Thêm liên kết báo cáo 6A. |

`UserDTO.password` tiếp tục serialize thành `null` theo hợp đồng response/test sẵn có; không ẩn/xóa field này để tránh làm đổi cấu trúc JSON của signup và admin user list. Endpoint profile vẫn trả entity hiện hữu nhưng password hash đã bị loại khỏi JSON.

## Kiểm chứng

- Test-first tái hiện trước sửa: search `{}` → NPE khi page null; profile trả password; member có thể GET `/api/users/list`.
- Sau sửa: **21/21 test API MySQL 6A đạt**, có Hibernate `ddl-auto=validate`, guard yêu cầu `library_db1` đúng và trống, transaction fixture rollback. Bao gồm signup/validation, catalog quyền/CRUD, Book stats, Genre count/CRUD, Wishlist, Plan create/update và danh sách User.
- `mvn clean package`: **BUILD SUCCESS**, **72/72 regression test**, 0 failure/error/skipped. Còn cảnh báo Lombok builder và Mockito dynamic-agent, không làm test thất bại.
- JDBC diagnostic chỉ đọc sau test: `library_db1`, MySQL 9.2.0, session `read_only=1`, 12 bảng 0 dòng.
- Không ALTER schema, không sửa dữ liệu; `git diff --check` sạch.
- JAR `Library/target/Library-0.0.1-SNAPSHOT.jar`, SHA-256 `BF683933509103C4F392BC9CD557DB92268B566E89FFF8A39D3BE3E0CB54B5CF`.

## Chưa tự ý đổi — chưa thể tuyên bố toàn bộ tài liệu 6A đã khớp

- A-11: code xóa cứng Plan, tài liệu mô tả xóa mềm. Đây là khác biệt business/data-retention; không đổi khi chưa có lựa chọn rõ ràng.
- GET `/api/books` có tham số `activeOnly` nhưng chưa chuyển vào request; repository hiện luôn lọc active. Định nghĩa dữ liệu trả về khi `activeOnly=false` chưa được tài liệu quy định rõ.
- Một số API tài liệu Wishlist/User/Genre/Plan chưa được controller expose; không tạo endpoint mới trong nhóm này.
- Coverage của các tổ hợp query/filter, unique race và toàn bộ nhánh API vẫn chưa đầy đủ; 6A không đồng nghĩa nghiệm thu toàn bộ module.
