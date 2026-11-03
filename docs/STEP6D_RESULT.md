# 6D — Kết quả triển khai Review

Ngày 05/10/2026, Asia/Saigon.

Lượt kiểm tra cuối 20:24:37. Executable JAR sau regression/package có SHA-256 `A8A3DD381F8C312C75D224A70871B612AF8C19AD724CF1D5DEEBFB86CE30ADD9`.

## Đã triển khai

| File | Thay đổi |
|---|---|
| `Library/src/main/java/com/library/modal/BookReview.java` | Map `is_active` với default true và giữ unique key user/book |
| `Library/src/main/java/com/library/repository/BookReviewRepository.java` | Danh sách sách chỉ lấy review active; truy xuất update/delete chỉ lấy review active |
| `Library/src/main/java/com/library/service/impl/BookReviewServiceImpl.java` | Xóa review bằng soft delete; owner-only update/delete; không cho update review đã inactive; validation phân trang; controlled lỗi thiếu sách/review; chỉ người có loan RETURNED được review |
| `Library/src/main/java/com/library/payload/dto/BookReviewDTO.java`, `mapper/BookReviewMapper.java` | Trả trạng thái active trong DTO |
| `Library/src/main/java/com/library/controller/BookReviewController.java` | POST tạo review trả 201 Created như tài liệu |
| `Library/src/main/java/com/library/exception/BookReviewException.java`, `BookReviewExceptionHandler.java` | Map business/not-found/access-denied thành 400/404/403; không catch-all lỗi hạ tầng |
| `Library/src/test/java/com/library/Step6ApiMySqlIT.java` | Điều chỉnh test từ hard-delete sang kiểm tra bản ghi còn tồn tại inactive, bị ẩn khỏi list, không update lại và duplicate vẫn bị chặn |

Schema `library_db1.book_reviews` đã được cập nhật sau khi người dùng xác nhận:

```sql
ALTER TABLE book_reviews
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER title;
```

Các review cũ được giữ và nhận giá trị active mặc định. Unique `(user_id, book_id)` giữ nguyên, do đó soft-deleted review vẫn chiếm định danh cặp user/sách và không thể tạo review thay thế. Không xóa dữ liệu.

## Kiểm chứng

- `clean compile` thành công; biên dịch 141 source Java và 22 source test.
- Sáu ca API MySQL review: **6/6 đạt**, gồm owner, user khác, quyền eligibility, duplicate, rating sai, create/update/soft-delete/list.
- Bộ regression/package (loại `Step6ApiMySqlIT`): **80/80 đạt**, `BUILD SUCCESS`.
- Các test API MySQL dùng MockMvc và transaction rollback, guard đúng `library_db1` và database rỗng. Không email hoặc payOS thật.
- Test xác nhận SQL `is_active=0`, row review còn tồn tại; list không trả row đã xóa; thử tạo lại cùng cặp bị chặn.
- Package khởi tạo JPA với schema validation nên xác nhận mapping `is_active` hiện tại.
- Không chạy lại standalone JAR; package đã tạo executable JAR mới.

## Phạm vi tài liệu chưa được expose

Tài liệu còn mô tả helpful vote/can-review/statistics, lịch sử review theo user và bộ lọc list. Các route đó chưa có trong controller hiện tại. Không thêm các chức năng mới trong lượt fix này; chúng vẫn mở trong bảng đối chiếu. `isVerifiedReader` cũng không có trong schema hiện tại nên không tự bổ sung cột.

## Còn giới hạn

- Unique key giữ lịch sử một review/user/book kể cả inactive như đã nêu.
- Chưa kiểm tra đồng thời review cùng cặp trên nhiều request; unique key DB vẫn là hàng rào cuối.
- Chưa chạy HTTP thật qua socket, standalone JAR, hoặc thử với dữ liệu production.
- Các cảnh báo Lombok trong `GenreDTO`/`ReservationSearchRequest` và `open-in-view` có từ trước, ngoài module 6D.
