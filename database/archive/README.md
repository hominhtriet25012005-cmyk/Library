# Tài liệu lưu trữ Database

Thư mục `legacy/` giữ script SQL và tiện ích Java từ các đợt khảo sát/chuyển đổi cũ (B0 và đề xuất Stage 4) để tra cứu lịch sử. Đây không phải schema chuẩn hiện tại.

- Không chạy file trong `legacy/` để dựng Database mới.
- Không chạy lại migration cũ trên MySQL live: một số script có thể thay đổi schema hoặc dữ liệu và chỉ phù hợp với trạng thái Database thời điểm cũ.
- Schema chuẩn hiện tại nằm ở [`../library_db1.sql`](../library_db1.sql); hướng dẫn migration còn hiệu lực ở [`../migrations/README.md`](../migrations/README.md).
- Các dump nằm riêng trong `backups/` và không đưa vào Git vì có thể chứa dữ liệu runtime.
