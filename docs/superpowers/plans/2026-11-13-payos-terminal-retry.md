# AUD2-BE-06 — payOS terminal retry implementation plan

**Goal:** Cho phép tạo payment payOS thay thế sau khi đơn cũ đã được payOS xác nhận ở trạng thái cuối, nhưng không tạo đơn mới khi trạng thái còn chưa chắc chắn.

## Contract đã chốt

- `PAID`: dùng luồng settlement hiện có; không được hạ trạng thái.
- `CANCELLED`: ghi payment nội bộ thành `CANCELLED`.
- `FAILED` hoặc `EXPIRED`: ghi payment nội bộ thành `FAILED`.
- `PENDING`, `PROCESSING`: tiếp tục dùng đơn hiện tại; không tạo đơn thay thế.
- `UNDERPAID`: giữ `PROCESSING` và yêu cầu đối soát thủ công; không tự tạo đơn thay thế.
- Store chỉ tái sử dụng payment payOS đang ở `PENDING` hoặc `PROCESSING`.

## Tasks

1. [x] Viết test trạng thái gateway cuối và test tạo payment thay thế.
2. [x] Thêm bộ đồng bộ trạng thái payment có khóa dòng và transaction riêng.
3. [x] Lọc payment có thể tái sử dụng tại store gói thành viên và tiền phạt.
4. [x] Nối đối soát vào confirmation và luồng mở lại payment hiện có.
5. [x] Chạy test tập trung, toàn bộ backend test và kiểm tra diff.

## Kết quả kiểm chứng

- 42/42 test payOS mục tiêu đạt, gồm trường hợp mở lại order mà payOS đã báo `PAID` và quyết toán qua luồng settlement hiện có.
- Toàn bộ Backend: 231/232 test đạt; một test HTTP xóa gói cũ ngoài phạm vi payOS lệch câu thông báo.
- Không thay đổi schema hoặc dữ liệu MySQL.

Không ALTER Database: các giá trị `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED` đã tồn tại trong enum Java và CHECK schema hiện tại.
