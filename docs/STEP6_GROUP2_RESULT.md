# Bước 6 — Nhóm 2: Gói thành viên + thống kê

Ngày 05/10/2026 (Asia/Saigon). Nhóm 2 đã sửa và kiểm chứng; **chưa hoàn thành toàn Bước 6**.

## Phạm vi và file

| File trong Library | Lý do thay đổi |
|---|---|
| src/main/java/com/library/service/impl/SubscriptionPlanServiceImpl.java | Trả DTO của entity từ repository.save thay vì null sau update |
| src/main/java/com/library/service/impl/GenreServiceImpl.java | Inject BookRepository và lấy count thật thay stub 0 |
| src/main/java/com/library/repository/BookRepository.java | Thêm derived query countByGenreId, không đổi schema |
| src/test/java/com/library/Step6ApiMySqlIT.java | Xác nhận DTO id/name/planCode/VND/price/maxBooks/updatedBy; count thể loại rỗng, nhiều sách, xóa mềm, thể loại con và xóa cứng |
| src/test/java/com/library/Group2ServiceTests.java | 3 unit test: chuyển count từ repository, map đúng entity đã save, plan không tồn tại không được save |
| README.md | Cập nhật trạng thái, kết quả và giới hạn |

Quy ước count dựa trên `docs/Library_Management_System_VI.md`, mục Endpoint thống kê: “Số sách đang dùng thể loại”. Đếm đầu sách tham chiếu trực tiếp (kể cả inactive vì vẫn giữ FK), không cộng bản sao hoặc thể loại con. Không tự thêm lọc active, không sửa field bookCount trong GenreDTO và không thêm business rule cho genre không tồn tại (query đếm trả 0).

## Bằng chứng

Áp dụng test-driven-development và verification-before-completion. Trước sửa, 3 ca mục tiêu đều fail: count trả 0 thay 1/2, plan response thiếu DTO/id. Sau sửa các ca đều đạt.

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' clean compile '-Dtest=Step6ApiMySqlIT,Group2ServiceTests' '-Dstep6.mysql=true' test
```

- Compile sạch 136 source và 20 test source thành công.
- 07:36:14: tổng 20 test, 0 failures, 1 error: **3/3 unit + 16/17 API đạt**.
- Ca duy nhất còn lỗi: `advancedSearchDefaultsShouldNotCrash`, POST /api/books/search body `{}` gây page null. Đã biết từ nhóm 1, không sửa ngoài phạm vi. Maven BUILD FAILURE trong lượt này phản ánh đúng lỗi đó, không phải nhóm 2 hoặc compile.
- Kiểm tra API qua MockMvc với security/service/repository và MySQL thật. Test rollback không thay thế HTTP socket/commit/concurrency production. Các khoản thanh toán/luồng mượn trả chưa được nghiệm thu ở nhóm này.

Hồi quy và package:

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=*Tests,*IT,!Step6ApiMySqlIT' '-Dspring.jpa.hibernate.ddl-auto=validate' '-Dspring.sql.init.mode=never' '-Dapp.initialize-admin=false' '-Dpayos.enabled=false' '-Dpayos.creation-enabled=false' '-Dspring.datasource.hikari.read-only=true' '-Dspring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=ON' '-Dspring.jpa.show-sql=false' package
```

07:36:50: **71 tests, 0 failures/errors/skipped; BUILD SUCCESS**. Đây là 68 test hồi quy cũ + 3 unit mới, không bao gồm bộ API opt-in còn lỗi. Không tuyên bố full suite xanh.

JAR mới SHA-256 `1b240588a915a96fca3f00652d7bf2ef365241fd4e0453e4f101efb8da1abaca`; giữ nội bộ vì cấu hình nhạy cảm hiện hữu vẫn được đóng gói. Chưa chạy lại standalone JAR; context/DI/query mới đã kiểm tra trong SpringBootTest. Clean xóa artifacts/log cũ trong target.

## An toàn và phần còn chờ

- Guard database rỗng và đúng library_db1 trước mỗi test ghi; không chạy đồng thời với app khác.
- Đọc lại bằng JDBC READ ONLY sau test: MySQL 9.2.0, library_db1, cả 12 bảng 0 dòng. Fixture đã rollback; AUTO_INCREMENT có thể tăng, không reset.
- Không thay schema, không sửa dữ liệu hiện có, không gửi email hoặc gọi payOS thật. Diff chỉ 3 file nghiệp vụ kể trên; `git diff --check` đạt. Giữ nguyên thay đổi nhóm 1 và mapping có sẵn.
- Lỗi search defaults vẫn chờ duyệt sửa. Các API mượn/trả, reservation, review, fines/payment và kiểm thử FK/transaction lỗi còn chờ trong Bước 6. Không tự chuyển Bước 7.
