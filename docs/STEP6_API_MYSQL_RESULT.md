# Bước 6 — Đợt 1: API + MySQL

Ngày 05/10/2026, Asia/Saigon. **Bước 6 chưa hoàn thành; chưa chuyển Bước 7.**

**Cập nhật sau báo cáo này:** nhóm sửa 1 đã triển khai và kiểm chứng. Xem [kết quả nhóm 1](STEP6_GROUP1_RESULT.md). Nội dung dưới đây là bằng chứng đợt đầu trước sửa, không phải trạng thái hiện tại của auth/catalog security.

## Cách kiểm tra và an toàn

- Test mới: `Library/src/test/java/com/library/Step6ApiMySqlIT.java`.
- SpringBootTest + MockMvc đi qua filter JWT, controller, service, repository thật, MySQL `library_db1` thật; không mock nghiệp vụ. Đây không phải HTTP qua socket hoặc test JAR.
- Mỗi test có transaction rollback, gọi flush/SQL đối chiếu ở các ca CRUD. Tạo hai tài khoản fixture bằng repository rồi đăng nhập qua API để lấy JWT; không coi việc bootstrap này là đăng ký thành công.
- Chỉ chạy khi `-Dstep6.mysql=true`; kiểm tra đúng database và mọi bảng rỗng trước khi chèn fixture. Không chạy đồng thời với người dùng/app khác. Nếu database có dữ liệu phải thiết kế lại fixture isolation và được duyệt, không bỏ guard.
- `ddl-auto=validate`, SQL init/admin initializer/payOS disabled. Không gọi email, webhook hoặc gateway thật. Không ALTER/DROP/TRUNCATE/seed dữ liệu lâu dài.
- Sau khi kết thúc, diagnostic JDBC READ ONLY xác nhận 12 bảng đều 0 bản ghi. Rollback không khôi phục AUTO_INCREMENT; có thể có khoảng trống ID, không tự reset ID.
- Transaction bao ngoài test có thể che thiếu transaction trong service: chưa chứng minh commit/rollback production, cạnh tranh đồng thời hoặc tương tác liên request thật.

## Kết quả thực chạy

Lệnh từ thư mục Library, dùng Maven cached 3.9.16, JDK23 target17:

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=Step6ApiMySqlIT' '-Dstep6.mysql=true' test
```

Test source compile thành công (19 lớp). Kết thúc 07:09:08: **10 tests, 6 pass, 3 failures, 1 error, 0 skipped; BUILD FAILURE do các lỗi nghiệp vụ tái hiện**, không phải lỗi compile/startup.

| Ca | Kết quả | Bằng chứng |
|---|---|---|
| Login + quyền admin | PASS | JWT từ login thật; admin đọc payments 200, member 403; member tạo plan 403; last_login ghi xuống MySQL |
| Đăng ký email mới | ERROR | UserException tại AuthServiceImpl:84; request không hoàn tất bình thường |
| Genre CRUD | PASS | Tạo/đọc/update/soft delete/hard delete fixture; SQL xác nhận name/active/số dòng |
| Book CRUD + FK hợp lệ | PASS | Tạo book có genre, query lọc, update, soft/hard delete; SQL kiểm tra title/genre_id/active |
| Book count theo genre | FAIL | Đã tạo 1 book, API trả 0 |
| Member không được xóa catalog | FAIL | DELETE /api/books/{id}/permanent trả 200 thay vì 403; yêu cầu đã đi qua service delete |
| Validation tạo book | PASS | Body {} trả 400, không chèn book |
| Wishlist | PASS | Thêm/đọc/xóa qua API, SQL xác nhận số dòng |
| Plan create/read/delete | PASS | API 200; MySQL lưu VND; xóa fixture thành công |
| Plan update DTO | FAIL | MySQL title đổi đúng nhưng HTTP 200 body rỗng, không có DTO/id |

Báo cáo máy: `Library/target/surefire-reports/TEST-com.library.Step6ApiMySqlIT.xml`. Target bị xóa khi clean. Báo cáo có thông tin fixture giả lập; không chứa khóa payOS hoặc JWT do test chủ động in ra.

## Vấn đề cần duyệt sửa

| Priority | Component | File/Table | Problem | Cause | Proposed Fix |
|---|---|---|---|---|---|
| HIGH | Security/catalog | SecurityConfig.java; BookController.java | Member gọi được xóa sách vĩnh viễn | Route /api/books không bị giới hạn ADMIN, rơi vào authenticated() | Xác nhận quyền quản trị catalog; giới hạn các mutation book/genre phù hợp, test cả admin/member; không đổi schema |
| HIGH | Authentication | AuthServiceImpl.java:83 | Email chưa tồn tại bị báo đã đăng ký | Điều kiện user == null bị đảo | Chỉ từ chối user != null; test email mới/trùng, không thay bảng users |
| MEDIUM | Exception handling | UserException.java; AuthController.java | Signup phát sinh invocation failure thay vì HTTP lỗi nghiệp vụ rõ ràng | UserException extends Throwable; chưa có mapping xử lý phù hợp trên đường này | Chuyển sang exception ứng dụng thông thường và ánh xạ 4xx theo contract; test không lộ password trong lỗi |
| MEDIUM | Subscription plan | SubscriptionPlanServiceImpl.java:51 | Update lưu được nhưng response rỗng | return null sau save | Trả DTO từ updatedPlan, giữ nguyên nghiệp vụ và DB |
| MEDIUM | Genre statistics | GenreServiceImpl.java:100 | Book count luôn 0 | Hàm stub return 0 | Query đếm theo genre; thống nhất đếm sách active hay tất cả trước sửa |

Không cần thay database để xử lý các lỗi đã xác nhận này. Không sửa source nghiệp vụ trong đợt kiểm tra.

## Phạm vi còn chờ

- Mượn/trả/gia hạn, reservation, review, reset-token, fines, membership/payment ownership và các nhánh lỗi.
- FK không hợp lệ/xóa bản ghi đang được tham chiếu; UNIQUE/CHECK/enum tại đường ghi; không suy ra từ FK hợp lệ ở test book.
- Tính nguyên tử, commit thực qua HTTP, nhiều request đồng thời. Bộ test rollback hiện tại không thay thế các kiểm tra này.
- payOS SDK/webhook xác thực và giao dịch thật: cần cấu hình an toàn, khóa mới, webhook và duyệt riêng; chưa làm frontend.

Đề xuất nhóm sửa nhỏ: (1) quyền catalog + auth, (2) response plan + count genre; mỗi nhóm kiểm thử lại, sau đó tiếp tục các luồng còn lại của Bước 6. Không tự triển khai sửa hoặc chuyển Bước 7.
