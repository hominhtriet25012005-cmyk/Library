# Migration Database

Migration là các lệnh nâng cấp một Database **đã có dữ liệu**. Chúng không phải một phần của quy trình tạo Database mới và không được chạy hàng loạt.

## Cách chọn file

- Database mới: chỉ chạy `../library_db1.sql`; không chạy migration lịch sử.
- Database cũ: sao lưu trước, đọc đúng điều kiện của migration, chạy truy vấn kiểm tra trước, rồi mới chạy lệnh thay đổi cấu trúc.
- Không chạy lại một migration đã áp dụng. `CREATE TABLE IF NOT EXISTS` không thay thế quy trình migration.

## Trạng thái MySQL live được đối chiếu ngày 21/11/2026

Database `library_db1` có đủ 17 bảng chuẩn. Migration `lr1-reservation-inventory.sql` đã được ghi dấu `LR1_RESERVED_COPIES`; không chạy lại vì migration này cập nhật số bản sách khả dụng.

Hai migration ngày 21/11/2026 chỉ được chuẩn bị trong Project, **chưa chạy trên MySQL live**:

1. `20261121_subscription_plan_checks.sql`: thay CHECK giá cũ và bổ sung CHECK tiền tệ/hạn mức cho `subscription_plans`.
2. `20261121_payment_target_check.sql`: bổ sung CHECK ràng buộc mục tiêu theo loại thanh toán.

Ở lần kiểm tra live gần nhất, dữ liệu hiện tại không vi phạm các quy tắc này. Tuy vậy cần sao lưu mới và kiểm tra lại ngay trước khi áp dụng vì Database có thể đã thay đổi sau ngày đối chiếu.

## Quy tắc an toàn

1. Xác nhận đang kết nối đúng schema `library_db1`.
2. Tạo bản sao lưu mới và kiểm tra file sao lưu có thể đọc được.
3. Chạy phần `SELECT` kiểm tra trong migration riêng; chỉ tiếp tục khi kết quả đúng như hướng dẫn trong file.
4. Xác nhận CHECK chưa tồn tại hoặc đang ở đúng phiên bản cũ trước khi chạy `ALTER TABLE`.
5. Chạy migration một lần rồi kiểm tra lại `information_schema`.

Không xóa, cập nhật hoặc tạo lại dữ liệu nghiệp vụ để làm cho migration chạy qua. Nếu truy vấn kiểm tra trả về bản ghi, dừng lại và đối chiếu từng bản ghi trước.
