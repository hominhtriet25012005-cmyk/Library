# 6C — Reservation: báo cáo kiểm tra lịch sử

> Cập nhật 31/10/2026: tài liệu dưới đây ghi lại hiện trạng tại thời điểm review 05/10/2026. Các lỗi 6C đã được sửa trong các giai đoạn sau; BE-2 tiếp tục hoàn thiện vòng đời `PENDING → AVAILABLE → FULFILLED/EXPIRED`, cửa sổ nhận 72 giờ và tự chuyển hàng đợi. Trạng thái hiện tại xem tại `BE2_RESERVATION_LIFECYCLE.md` và `STEP6_TRACEABILITY.md`.

> Đây là mốc review trước sửa. Kết quả mới: [sửa 6C, còn chờ policy ngày mượn](STEP6C_FIX_RESULT.md).

05/10/2026, Asia/Saigon. Đã chuyển sang 6C sau khi 6B đạt bộ kiểm chứng đã xác định. **Chỉ thêm test, không sửa ReservationService/Controller/Entity/Repository.**

Đọc controller/service/entity/repository/request/mapper, đối chiếu phần Reservation trong Library_Management_System_VI.md. Chạy MySQL thật với Spring MVC/security/service/repository; membership và trạng thái sách là fixture. Guard database rỗng; rollback sau mỗi test, không email/payOS thật.

```powershell
mvn -o '-Dmaven.repo.local=C:/Users/APC/.m2/repository' '-Dtest=Step6ApiMySqlIT#reservation*+duplicateReservation*+crossUserReservation*+adminReservation*+memberCannotReserve*+ownerReservation*+cancelledReservation*' '-Dstep6.mysql=true' test
```

Lần chạy 14:47:17: **16 test: 5 pass, 7 failures, 4 errors, 0 skipped; BUILD FAILURE do các ca chưa đạt**, compile thành công. Báo cáo máy riêng: `Library/target/step6c-reservations-review.xml`.

| Tình huống | Kết quả |
|---|---|
| Tạo → xem /my → hủy bản thân | ĐẠT |
| /my cách ly user, lọc PENDING | ĐẠT |
| Thiếu bookId | ĐẠT: 400, không tạo reservation |
| Admin hủy thay người dùng | ĐẠT |
| Chủ sở hữu fulfill với gói cho phép 30 ngày | ĐẠT: loan tạo, status FULFILLED, inventory giảm |
| Member gọi đặt hộ người khác | FAIL: 201 thay 403 |
| Admin đặt hộ | FAIL: user_id lưu admin thay target |
| Sách inactive | FAIL: vẫn tạo reservation 200 |
| Reservation hết hạn nhận sách | FAIL: vẫn fulfill 200 |
| Reservation đã hủy | FAIL: vẫn fulfill 200 khi sách có sẵn |
| Người khác fulfill | FAIL: 403 từ service loan nhưng reservation đã bị đổi thành FULFILLED trước đó |
| Hàng đợi sau hủy và thêm mới | FAIL: hai vị trí cùng bằng 2; người đến sau không có vị trí lớn hơn |
| Đặt trùng | ERROR: service chặn nhưng generic Exception không được map 4xx |
| Sách đang có sẵn | ERROR: service chặn nhưng generic Exception không được map 4xx |
| Hủy reservation của người khác | ERROR: kiểm tra ownership có, nhưng generic Exception thay vì 403 |
| Fulfill với gói 7 ngày | ERROR: Reservation gửi CheckoutRequest mặc định 14, loan từ chối vượt gói; lỗi không được map ở Reservation |

Test hủy/hết hạn và unauthorized fulfill dùng quota ngày 30 để không bị lỗi default 14 che mất lỗi trạng thái/quyền. Ca gói 7 giữ riêng để báo đúng vấn đề tích hợp. Không thay kỳ vọng để che lỗi.

## Vấn đề cần duyệt sửa

| Priority | File/Component | Cause | Proposed fix |
|---|---|---|---|
| HIGH | SecurityConfig / ReservationServiceImpl.createReservationForUser | Route đặt hộ chỉ authenticated; service dùng currentUser thay userId | Chặn member đặt hộ, resolve target đúng sau kiểm tra quyền |
| HIGH | ReservationServiceImpl.fulfillReservation | Ghi FULFILLED trước checkout, không kiểm tra owner/status/expiry ở đầu | Authorize + validate trước mutation; transaction bao reservation và loan, chỉ chuyển trạng thái khi checkout thành công |
| HIGH | fulfillReservation → BookLoanService | Hard-code gián tiếp default 14 không khớp quota ngày | Chọn số ngày theo policy membership được duyệt; không bỏ giới hạn 6B |
| MEDIUM | createReservationForUser | Không kiểm tra book.active | Chặn đặt sách inactive |
| MEDIUM | QueuePosition/cancel/create | Lấy count pending +1 nhưng không cập nhật thứ tự sau hủy | Thống nhất cơ chế thứ tự/hủy và khóa khi có concurrency; không tự ALTER UNIQUE khi chưa cần |
| MEDIUM | Exception handling | Generic Exception không mapped | Exception nghiệp vụ riêng, 400/403 phù hợp, giữ lỗi infrastructure không bị che |

Không đề xuất redesign database. Các lỗi xác nhận chủ yếu ở Backend. Với cross-user fulfill, SQL trong transaction test quan sát status đã đổi dù HTTP 403; test sau đó rollback. **Chưa tái hiện commit trái phép qua HTTP thực trên MySQL**; source không có outer transaction khiến có rủi ro lưu trạng thái riêng trước khi loan thất bại.

## Còn chưa nghiệm thu

Quota 5 reservation, loan đang active/overdue khi đặt trước, ưu tiên phục vụ hàng đợi, thiếu sách/missing ID, fulfill lặp, input biên, race đặt/fulfill/cancel và commit/rollback production. Tài liệu liệt kê một số endpoint chưa có trong code; không tự thêm chức năng dựa riêng vào tài liệu.

Database sau kiểm tra và regression: 12 bảng đều 0 dòng. Không thay schema hoặc dữ liệu có sẵn; không reset AUTO_INCREMENT. Chưa sửa lỗi 6C, chưa bắt đầu 6D. Chờ người dùng duyệt bước tiếp theo.
