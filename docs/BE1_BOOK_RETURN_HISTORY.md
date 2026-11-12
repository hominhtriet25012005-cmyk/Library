# BE-1 — Trả sách và lịch sử quá hạn (giai đoạn lịch sử)

Ngày hoàn tất: 31/10/2026 (Asia/Saigon).

## Phạm vi đã triển khai

- `RETURNED`: đóng lượt mượn và cộng đúng một bản vào kho sẵn.
- `DAMAGED`, `LOST`: đóng lượt mượn nhưng không đưa bản sách trở lại kho sẵn.
- Khi trả quá hạn, lưu `max(overdueDays đã ghi, số ngày trễ thực tế)` để batch chạy sớm hay muộn đều không làm mất lịch sử.
- Sau khi đóng lượt mượn, `isOverdue=false`; `overdueDays` vẫn giữ làm lịch sử.
- Ghi chú trả sách được nối sau ghi chú hiện có. Ghi chú null/trống không làm mất nội dung cũ.
- Từ chối trước khi thay đổi lượt mượn nếu ghi chú sau khi nối vượt 500 ký tự.

## File code và test

- `Library/src/main/java/com/library/service/impl/BookLoanServiceImpl.java`
- `Library/src/test/java/com/library/BookLoanCheckinHistoryTests.java`
- `Library/src/test/java/com/library/Step6ApiMySqlIT.java`

Kết quả kiểm thử mới:

- `BookLoanCheckinHistoryTests`: 5/5 đạt.
- `BookLoanOverdueBatchTests`: 1/1 đạt.
- Tại thời điểm BE-1, `BookLoanAtomicityTests` chưa chạy được vì mapping `SMALLINT UNSIGNED` chưa phù hợp H2. BE-5 đã sửa mapping năm xuất bản sang JDBC `SMALLINT`; nghiệm thu RB-7 chạy lại bộ Maven mặc định đạt 199/199 test.
- `Step6ApiMySqlIT` đã cập nhật kỳ vọng và ca lịch sử BE-1; không chạy trên `library_db1` có dữ liệu. MySQL integration profile hiện yêu cầu database cô lập có hậu tố `_test`.

## Không thuộc BE-1

- Không tự tạo tiền phạt khi trả quá hạn; V1 tiếp tục cho ADMIN tạo/miễn tiền phạt theo nghiệp vụ hiện có.
- Không tự chuyển người đầu hàng đợi đặt giữ sang `AVAILABLE`; đây là BE-2.
- Không thay đổi schema MySQL hoặc `library_db1.sql`.

## Nghiệp vụ trả sách hiện hành

BE-1 ban đầu đóng lượt mượn trực tiếp khi gọi check-in. Từ RB-1 đến RB-6, luồng đó đã được
mở rộng thành quy trình hai bước: USER chỉ gửi yêu cầu; ADMIN nhận sách, kiểm tra tình trạng
thực tế rồi mới check-in. Vì vậy các ghi chú “không tự tạo tiền phạt” và “không tự chuyển lượt
đặt giữ” ở phần trên chỉ mô tả phạm vi BE-1 tại ngày hoàn tất, không còn mô tả đầy đủ nghiệp vụ
hiện tại.

- Chỉ ADMIN được hoàn tất check-in; USER không tự đổi trạng thái hoặc tồn kho.
- `RETURNED` cộng lại một bản và có thể kích hoạt lượt đặt giữ đầu hàng.
- `DAMAGED`/`LOST` không cộng lại bản sách; ADMIN ghi nhận kiểm tra và Backend tạo khoản phạt
  trong cùng transaction.
- Chính sách hiện hành: quá hạn `min(số ngày trễ × 5.000đ, giá tham chiếu)`; hư hỏng nhẹ 25%,
  hư hỏng nặng 75%; mất sách 100% giá tham chiếu + 20.000đ phí xử lý.
- Chi tiết trạng thái code/schema, API, giao diện và nghiệm thu được theo dõi tại
  [`docs/fix-returnbook.md`](fix-returnbook.md).
