# Bước 7 — Final Review

Ngày review: 05/10/2026. Trạng thái: **đã lập kết quả review; chưa đủ điều kiện nghiệm thu toàn bộ backend**.

## 1. Phạm vi và nguyên tắc

- Đối chiếu tài liệu `Library_Management_System_VI.md`, bảng `STEP6_TRACEABILITY.md`, thay đổi backend và bộ test hiện có. Mốc Git: `70008b2` đến HEAD `b7d8816` và working tree; diff tracked tổng cộng 101 file. Working tree riêng có 42 file tracked thay đổi, cùng các test/file chưa tracked. Con số file không đồng nghĩa mọi nhánh thực thi đã được kiểm thử.
- Review tập trung vào mapping, quyền truy cập, tồn kho, mượn/trả/gia hạn, reservation, review, subscription, fine, payOS, transaction và độ tin cậy của báo cáo kiểm thử.
- Áp dụng các quyết định đã duyệt: VND/payOS, `/api/users/list` chỉ ADMIN, thời hạn fulfillment `min(14, hạn mức gói)`.
- Không sửa source production, không ALTER/DROP/TRUNCATE, không gọi payOS hay gửi tiền thật trong đợt review này. Chỉ chạy bộ API MySQL opt-in có transaction rollback, chặn nếu DB không rỗng, rồi kiểm tra DB chỉ đọc.
- Các lỗi dưới đây là kết luận từ đường đi source. Chưa bổ sung test tái hiện riêng cho từng lỗi; không trình bày chúng như lỗi đã tái hiện qua giao dịch thật. Có cả lỗi tồn tại từ trước, không quy tất cả thành regression của Bước 6.

## 2. Vấn đề cần xử lý

| ID | Priority | Component / File | Problem và Cause | Proposed Fix nhỏ nhất |
|---|---|---|---|---|
| FR-01 | HIGH | `Library/src/main/java/com/library/service/impl/BookServiceImpl.java:74`, `mapper/BookMapper.java:99` | Catalog đọc/sửa/lưu sách không có transaction khóa chung với checkout/checkin. DTO ghi đè trực tiếp total/available. Admin đọc available=1; checkout commit available=0; admin lưu dữ liệu cũ làm available trở lại 1. CHECK available<=total vẫn hợp lệ nên DB không ngăn được sai tồn kho. Soft-delete cũng đọc rồi save toàn entity không khóa. | Gom thao tác cập nhật trong transaction, dùng cùng khóa sách với checkout/checkin; phân biệt sửa metadata và điều chỉnh tồn kho. Không tin số available cũ từ client. Khóa một mình không giải quyết DTO đã lỗi thời; phải chốt quy tắc điều chỉnh số lượng và test tương tác catalog–loan. Không cần redesign DB. |
| FR-02 | HIGH | `service/impl/PayOSSettlementService.java:30–62`, `service/impl/PayOSOrderStore.java:26`, `repository/SubscriptionRepository.java:30` | Có thể thanh toán hai gói khác nhau, hoặc mua thêm khi đã có gói active: draft chỉ tái sử dụng pending của cùng plan; settlement chỉ khóa subscription/payment đích, không kiểm tra gói active khác của user. Cả hai có thể active cùng khoảng ngày. Truy vấn active trả `Optional<Subscription>` không giới hạn một dòng nên phát sinh lỗi nhiều kết quả, ảnh hưởng đọc gói và checkout/fulfillment. | Chốt chính sách mua gói khi đang có gói khác trước khi sửa: từ chối mua chồng, nối hạn hay thay thế. Sau đó áp dụng nhất quán ở tạo đơn và settlement, khóa theo user và kiểm tra lại. Không tự hủy gói đã trả tiền, không chữa bằng chọn tùy tiện một dòng. Test hai đơn khác nhau; test callback lặp cùng đơn hiện tại chưa phủ trường hợp này. |
| FR-03 | HIGH | `configrations/JwtConstant.java`, `configrations/JwtProvider.java:20`, `configrations/JwtValidator.java`; `src/main/resources/application.properties:19,26` | Khóa ký JWT cố định trong source; mật khẩu DB/mail là giá trị trực tiếp trong file cấu hình. Người có khóa JWT có thể ký claim quyền mà filter tin cậy. Đây là nợ bảo mật tồn tại sẵn, đặc biệt phải xử lý trước chia sẻ repo/JAR hoặc mở webhook ra Internet. | Đưa secret ra cấu hình môi trường, không có fallback secret cố định; thay khóa/mật khẩu đã lộ. Đổi JWT key sẽ làm token cũ mất hiệu lực nên cần thông báo. Chưa thực hiện đổi thông tin tài khoản trong review. Không ghi lại giá trị secret trong báo cáo. |
| FR-04 | MEDIUM | `service/impl/BookLoanServiceImpl.java:312`, `repository/BookLoanRepository.java:49` | Job quá hạn luôn lấy trang 0, tối đa 1.000, không lặp trang và không sort ổn định. Query chọn cả CHECKED_OUT lẫn OVERDUE nên dòng đã cập nhật vẫn nằm trong tập kết quả. Với hơn 1.000 dòng, các lần chạy có thể tiếp tục xử lý cùng tập đầu và bỏ sót các dòng sau; overdueDays cũng không được cập nhật đủ. Đây không phải lỗi vừa được tạo bởi việc thêm khóa. | Duyệt batch ổn định theo ID/keyset, xử lý hết tập cần cập nhật và giữ kiểm tra lại dưới khóa. Test ít nhất 1.001 dòng với cả hai trạng thái và chạy lại ngày tiếp theo. |
| FR-05 | MEDIUM | `mapper/GenreMapper.java:81–84`, `mapper/GenreMapper.java:38–41` | Cập nhật parent chỉ kiểm tra tìm thấy ID, không chặn chính nó hay hậu duệ. FK không cấm chu trình A→B→A. Mapper đệ quy subGenres không có phát hiện vòng, có thể StackOverflowError khi đọc cây; dữ liệu chu trình có thể đã commit trước lúc map response. Lỗi tồn tại sẵn trong module catalog. | Kiểm tra self/descendant trước save trong transaction; trả lỗi có kiểm soát. Test self-parent và chu trình nhiều cấp. Không tự sửa/xóa dữ liệu cây cũ. |
| FR-06 | MEDIUM | `Library/pom.xml:130`, các lớp `*IT` | Maven mặc định không chọn các lớp tên `*IT`, và pom chưa cấu hình profile integration/Failsafe. Vì vậy `mvn test` đạt không chứng minh các API/schema/MySQL IT đã chạy. Hiện phải chọn rõ bằng `-Dtest` và bật opt-in. | Giữ mặc định an toàn không đụng MySQL chính; bổ sung hướng dẫn/profile opt-in chạy đúng lớp, giữ guard DB và không bật test committed tự động. Ghi tách số test thường, API rollback và committed race. |
| FR-07 | LOW | `docs/STEP6_TRACEABILITY.md:5,37–48`, `docs/BACKEND_FIX_PLAN.md` | Tổng quan tiến độ cũ còn ghi 6D/6G/6H chưa nghiệm thu dù các phần cuối đã có kết quả. Người đọc dễ hiểu nhầm chưa làm hoặc đã phủ hết, tùy vị trí đọc. | Đồng bộ bảng điều hành với kết quả mới, giữ số liệu cũ dưới nhãn lịch sử; liên kết báo cáo Bước 7 và các lỗi còn mở. |

FR-01/04/05 là lỗi còn tồn tại ở phạm vi liên quan, không phải bằng chứng toàn bộ sửa chữa trước đây sai. FR-02 là khoảng trống quan trọng trong luồng payOS mới. FR-03 là điều kiện cần xử lý trước triển khai sử dụng thực tế. Không phát hiện căn cứ buộc phải tạo lại database để giải quyết các mục này.

## 3. Kiểm chứng thực hiện trong Bước 7

Lệnh chạy tại `Library`, dùng Maven 3.9.16 và local repository hiện có:

```text
mvn -o -Dmaven.repo.local=C:\Users\APC\.m2\repository -Dtest=Step6ApiMySqlIT -Dstep6.mysql=true test
```

- Kết thúc 22:45:02 ngày 05/10/2026, process exit code 0, BUILD SUCCESS.
- **104 tests, 0 failures, 0 errors, 0 skipped**; không chỉ chọn năm test constraint như lượt cuối 6H.
- Spring context, MySQL connection và Hibernate `ddl-auto=validate` khởi tạo thành công trong test này.
- Test dùng MockMvc + security filter + MySQL thật, transaction rollback; payOS tắt và email mock. Không được gọi đây là 104 test HTTP qua socket hoặc giao dịch ngân hàng thật.
- Sau test: công cụ `database/SchemaReadOnlyCheck.java` kết nối đúng `library_db1`, MySQL 9.2.0, read_only=1; **12 bảng đều 0 dòng**. Không còn fixture của bộ test. AUTO_INCREMENT có thể tăng dù rollback, không reset lại.
- `git diff --check` không báo lỗi whitespace; có cảnh báo chuyển LF/CRLF ở PayOSController.

Kết quả lịch sử gần nhất từ 6H, không phải tất cả được chạy lại trong đợt này:

| Kiểm chứng trước đó | Kết quả và giới hạn |
|---|---|
| clean package, bỏ chạy test | Thành công; không thay thế việc chạy test |
| JAR port 18001, ddl validate, payOS tắt | Startup và login không hợp lệ được kiểm tra; không phải full API trên JAR |
| `mvn test` | 72 test đạt; không tự bao gồm các lớp `*IT` |
| Lượt integration được chọn | 19 đạt: 9 mapping/schema, 5 constraint, 4 G03, 1 H live HTTP flow |

Không cộng cơ học 19 + 104 thành số ca độc lập vì có năm ca trùng nhau.

## 4. Giới hạn nghiệm thu còn lại

- Hibernate validate và các mapping test đạt trong phạm vi hiện có; không chứng minh toàn bộ CHECK, index, default, cascade, mọi enum/giới hạn đầu vào đều đúng. Chưa có căn cứ tuyên bố “không còn bất kỳ lỗi mapping nào”.
- G03 có test cùng payment settlement và checkout bản cuối, nhưng chưa phủ catalog với checkout, hai subscription khác nhau của một user, hoặc mọi thứ tự lock.
- Test rollback đặt transaction bao ngoài rồi chủ động ném lỗi chứng minh rollback của transaction đó, chưa thay thế mọi kịch bản lỗi nội bộ service.
- Lượt live HTTP 6H chạy embedded server trong test; payOS tắt. Chưa kiểm thử webhook Internet, QR/chuyển khoản thật, timeout/partial/overpayment thực tế. Không bật payment creation chỉ vì test offline xanh.
- Cập nhật 31/10/2026: phần Payment trong tài liệu gốc đã được đồng bộ theo payOS/VietQR/VND và endpoint hiện có. Các mục rộng hơn chưa có code vẫn không được tự coi là đã triển khai.
- Chính sách nhiều gói cùng hiệu lực và điều chỉnh tồn kho cần chốt để sửa đúng nghiệp vụ, không tự suy diễn.

## 5. Trình tự đề nghị sau review

1. Nhóm R1: secret/JWT và an toàn triển khai (FR-03).
2. Nhóm R2: tồn kho catalog đồng bộ loan (FR-01); test dữ liệu cũ từ client và chạy đồng thời.
3. Nhóm R3: chốt chính sách rồi xử lý nhiều subscription (FR-02); chưa thử tiền thật trước khi xong.
4. Nhóm R4: batch quá hạn và cây genre (FR-04/05), triển khai/test từng phần.
5. Nhóm R5: quy trình integration test và đồng bộ tài liệu tiến độ (FR-06/07); build, regression và final review lại.

Đây là **đề xuất**, chưa bắt đầu fix. Các thay đổi ở source/schema vẫn giữ nguyên như trước review. Bước 4/5 có bằng chứng build/startup thành công; Bước 6 có bằng chứng cho các ca đã chạy. Bước 7 phát hiện các mục còn mở nên chưa đóng nghiệm thu toàn bộ hệ thống.
