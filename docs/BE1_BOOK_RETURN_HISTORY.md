# BE-1 — Trả sách và lịch sử quá hạn

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
- `BookLoanAtomicityTests`: chưa chạy được do harness H2 không hỗ trợ `SMALLINT UNSIGNED` của MySQL ở bước tạo bảng; lỗi không đi vào logic trả sách.
- `Step6ApiMySqlIT`: đã cập nhật kỳ vọng và ca lịch sử BE-1, chưa chạy vì suite chỉ cho ghi fixture khi `library_db1` hoàn toàn rỗng.

## Không thuộc BE-1

- Không tự tạo tiền phạt khi trả quá hạn; V1 tiếp tục cho ADMIN tạo/miễn tiền phạt theo nghiệp vụ hiện có.
- Không tự chuyển người đầu hàng đợi đặt giữ sang `AVAILABLE`; đây là BE-2.
- Không thay đổi schema MySQL hoặc `library_db1.sql`.
