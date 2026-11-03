# Bước 6 — Kết quả sửa nhóm 1

05/10/2026, Asia/Saigon. Phạm vi được duyệt: phân quyền catalog và đăng ký tài khoản. Không sửa nhóm 2, không thay database, frontend hoặc payment.

## File thay đổi và lý do

| File trong Library | Thay đổi |
|---|---|
| src/main/java/com/library/configrations/SecurityConfig.java | ADMIN cho POST /api/books/bulk, /api/genres/create; PUT/DELETE /api/books/** và /api/genres/**. Không chặn POST /api/books/search của USER |
| src/main/java/com/library/service/impl/AuthServiceImpl.java | Chỉ từ chối signup khi email đã tồn tại; JWT signup có authority từ ROLE_USER đã lưu; Authentication không mang password |
| src/main/java/com/library/controller/AuthController.java | @Valid cho signup |
| src/main/java/com/library/payload/dto/UserDTO.java | NotBlank, Email, giới hạn email/name/phone theo schema; loại password khỏi toString |
| src/main/java/com/library/exception/UserException.java | Extends Exception thay Throwable để MVC xử lý lỗi ứng dụng đúng đường |
| src/main/java/com/library/exception/GlobalException.java | Map UserException sang 400 + ApiResponse(status=false). Áp dụng cả các đường auth hiện có dùng exception này, không thêm catch-all |
| src/test/java/com/library/Step6ApiMySqlIT.java | Bổ sung hồi quy signup, quyền catalog; giữ test lỗi ngoài nhóm |
| README.md | Cập nhật trạng thái và giới hạn kiểm chứng |

Các thay đổi mapping BookReview/PasswordResetToken có sẵn trước lượt này được giữ nguyên.

## Test-first và kết quả sau sửa

- Trước sửa, bộ mở rộng 15 test: 4 failures, 5 errors. Tái hiện signup mới bị chặn, signup trùng đi tới UNIQUE violation, thiếu validation, USER được phép ghi catalog.
- Phát hiện thêm ngoài phạm vi: POST /api/books/search body `{}` gây NullPointerException vì getPage() null. Tách riêng ca `advancedSearchDefaultsShouldNotCrash`; ca quyền tìm kiếm dùng payload đầy đủ để kiểm tra đúng authorization, không che lỗi defaults.
- Sau sửa: 16 test, **13 pass, 2 failures, 1 error**. Không có test nhóm 1 thất bại.
- Signup mới lưu password BCrypt, role luôn USER dù request đòi ADMIN; JWT có ROLE_USER và dùng được cho GET catalog nhưng không đọc payments admin. Signup trùng 400, không đổi hash hoặc số user. Signup thiếu/blank/email sai 400.
- 9 route ghi catalog: USER và anonymous đều 403; ADMIN vẫn tạo/update/soft delete/hard delete/bulk được qua các ca CRUD. USER vẫn tìm kiếm với payload đầy đủ và đọc catalog.
- Toàn bộ test dùng MVC/security/service/repository thật + MySQL trong transaction rollback, không HTTP qua socket; chưa chứng minh commit/concurrency production. Không mock đăng ký: các tài khoản admin/user phục vụ setup được seed riêng bằng repository rồi login API thật.
- Chưa kiểm thử đăng ký đồng thời cùng email; UNIQUE của MySQL còn nguyên nhưng xử lý race này chưa được nghiệm thu. Không kết luận mọi nhánh auth đều đã được kiểm thử.

Lệnh kiểm chứng API (vẫn thất bại do 3 ca ngoài nhóm):

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' clean compile '-Dtest=Step6ApiMySqlIT' '-Dstep6.mysql=true' test
```

136 source và 19 test source compile thành công. Kết thúc 07:30:10. Các ca còn lỗi:

| Ca | Kết quả | Phạm vi |
|---|---|---|
| planUpdateReturnsUpdatedDto | response rỗng thay vì DTO | Nhóm 2 cũ, chưa sửa |
| bookCountMatchesDatabase | 0 thay vì 1 | Nhóm 2 cũ, chưa sửa |
| advancedSearchDefaultsShouldNotCrash | page null gây NPE | Lỗi bổ sung cần duyệt nhóm riêng hoặc bổ sung nhóm 2 |

Lệnh hồi quy/package chỉ chọn bộ 68 test trước Bước 6:

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=*Tests,*IT,!Step6ApiMySqlIT' '-Dspring.jpa.hibernate.ddl-auto=validate' '-Dspring.sql.init.mode=never' '-Dapp.initialize-admin=false' '-Dpayos.enabled=false' '-Dpayos.creation-enabled=false' '-Dspring.datasource.hikari.read-only=true' '-Dspring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=ON' '-Dspring.jpa.show-sql=false' package
```

**68 tests, 0 failures/errors/skipped; BUILD SUCCESS**, 07:30:52. Không coi kết quả chọn lọc này là toàn suite xanh. JAR mới hash SHA-256: `67cd96e834af5a7bb646510cfe48cb7fe61128f02de90d8fea10603c225d0ca5`. Artifact chứa cấu hình hiện hữu: giữ nội bộ, không upload công khai.

## Review và dữ liệu

Áp dụng systematic-debugging để khoanh nguyên nhân, TDD để tái hiện trước sửa, verification-before-completion cho kết quả mới. Tự review diff theo requesting-code-review: matcher đặt trước authenticated catch-all, không chặn search bằng POST, không nhận role từ client, không sửa schema/flow payment. `git diff --check` không lỗi.

Guard test từ chối ghi nếu không phải library_db1 hoặc có bất kỳ bảng không rỗng. Sau cả các lần chạy, JDBC READ ONLY xác nhận 12 bảng đều 0 dòng; dữ liệu thử đã rollback. AUTO_INCREMENT có thể tăng, không tự reset. Không gửi email, gọi payOS thật hoặc để server test chạy nền.

**Nhóm 1 hoàn tất trong phạm vi đã kiểm chứng. Bước 6 chưa hoàn tất.** Nhóm 2 và lỗi search mới chờ người dùng duyệt; các luồng mượn/trả/reservation/review/fine còn chờ kiểm thử đầy đủ.
