# BE-2 — Vòng đời đặt giữ

Ngày nghiệm thu mã: 31/10/2026 (Asia/Saigon).

## Phạm vi đã triển khai

1. Trả sách với kết quả `RETURNED` tăng tồn kho rồi kích hoạt lượt `PENDING` đầu tiên của đúng đầu sách.
2. Lượt được kích hoạt chuyển sang `AVAILABLE`, ghi `availableAt` và `availableUntil = availableAt + 72 giờ`.
3. Scheduler mặc định chạy sau mỗi 60 giây, lấy tối đa 100 ID mỗi lô; lượt `AVAILABLE` đến hạn chuyển thành `EXPIRED` rồi kích hoạt người kế tiếp.
4. Hủy và giao thành công đều đặt `queuePosition = null`, sắp lại hàng đang hoạt động và thử kích hoạt lượt kế tiếp.
5. Chỉ ADMIN được giao lượt; reservation phải là `AVAILABLE`, chưa hết hạn, đứng đầu hàng và sách còn bản sẵn.
6. Checkout thông thường bị chặn nếu đầu sách đang có lượt `AVAILABLE`. Checkout từ reservation dùng nhánh riêng để tiêu thụ đúng bản được giữ nhưng vẫn tuân thủ quota mượn và quy tắc `min(14, hạn mức gói)`.
7. Khóa bi quan trên sách được dùng khi kích hoạt, hết hạn và checkout để giảm nguy cơ hai tiến trình cùng tiêu thụ một bản.

## Cấu hình runtime

```properties
app.reservations.expiry-scan-delay-ms=${RESERVATION_EXPIRY_SCAN_DELAY_MS:60000}
app.reservations.expiry-scan-initial-delay-ms=${RESERVATION_EXPIRY_SCAN_INITIAL_DELAY_MS:60000}
```

Kích thước lô hiện cố định là 100. Không cần ALTER; `library_db1.sql` đã có đủ cột và CHECK/FK cần thiết.

## Kiểm thử

- `ReservationLifecycleTests`: kích hoạt đầu hàng, cửa sổ 72 giờ, không tạo hai lượt AVAILABLE, không kích hoạt khi hết bản, hết hạn/chuyển lượt.
- `ReservationServiceLifecycleTests`: chặn fulfill PENDING, hủy AVAILABLE và fulfill AVAILABLE đều chuyển hàng.
- `ReservationExpirySchedulerTests`: scheduler gọi lifecycle với lô 100.
- `BookLoanReservationGuardTests`: mượn thường không lấy bản đang giữ.
- `BookLoanCheckinHistoryTests`: trả bình thường kích hoạt hàng; mất/hỏng không kích hoạt.
- `Step6ApiMySqlIT`: đã thêm ca trả sách kích hoạt lượt và hết hạn chuyển lượt. Suite này là opt-in và từ chối chạy nếu database chính không rỗng.

Kết quả nghiệm thu: **19/19 test được chọn đạt**, gồm các test trên, `BookLoanOverdueBatchTests` và test quyền HTTP ADMIN cho mượn–trả/đặt giữ. Backend đóng gói thành công bằng `mvn -DskipTests package`.

## Ngoài phạm vi V1

- Chưa gửi email hoặc tạo thông báo Topbar khi lượt chuyển sang AVAILABLE.
- Chưa có cơ chế nhiều tiến trình scheduler phân tán; bản triển khai hiện phù hợp một Backend instance.
- Không tự tạo tiền phạt từ việc reservation hết hạn.
