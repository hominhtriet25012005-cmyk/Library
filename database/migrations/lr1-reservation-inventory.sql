-- Migration lịch sử LR-1: chỉ dùng cho Database cũ chưa ghi dấu đã chuyển đổi.
-- Dừng Backend và sao lưu Database trước khi áp dụng.
-- Trước LR-1, sách ở trạng thái AVAILABLE vẫn được tính trong available_copies.
-- Lệnh UPDATE bên dưới trừ các bản đang được giữ khỏi số bản có thể cho mượn.
-- Không chạy migration này trên Database mới hoặc Database đã có dấu LR1_RESERVED_COPIES.
USE library_db1;
CREATE TABLE IF NOT EXISTS lr_schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DELIMITER $$
CREATE PROCEDURE apply_lr1_inventory()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    IF NOT EXISTS (SELECT 1 FROM lr_schema_migrations WHERE version = 'LR1_RESERVED_COPIES') THEN
        IF EXISTS (
            SELECT 1 FROM books b JOIN (
                SELECT book_id, COUNT(*) AS held FROM reservations
                WHERE status = 'AVAILABLE' GROUP BY book_id
            ) r ON r.book_id = b.id WHERE b.available_copies < r.held
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'So ban sach kha dung khong du de tru cac ban dang duoc giu; can doi chieu truoc khi chuyen doi';
        END IF;
        UPDATE books b JOIN (
            SELECT book_id, COUNT(*) AS held FROM reservations
            WHERE status = 'AVAILABLE' GROUP BY book_id
        ) r ON r.book_id = b.id
        SET b.available_copies = b.available_copies - r.held;
        INSERT INTO lr_schema_migrations(version) VALUES ('LR1_RESERVED_COPIES');
    END IF;
    COMMIT;
END$$
DELIMITER ;
CALL apply_lr1_inventory();
DROP PROCEDURE apply_lr1_inventory;
