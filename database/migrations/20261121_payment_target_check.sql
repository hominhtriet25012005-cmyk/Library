-- Migration một lần cho Database cũ đã có bảng payments nhưng thiếu CHECK
-- chk_payments_target. Dừng Backend và sao lưu trước khi áp dụng.
-- Không chạy file này trên Database mới được tạo từ library_db1.sql.
-- Migration không xóa hoặc sửa lịch sử thanh toán.

-- Bước 1: chạy truy vấn dưới đây riêng. Kết quả phải rỗng.
SELECT id, payment_type, subscription_id, fine_id, book_loan_id
FROM library_db1.payments
WHERE NOT (
    (payment_type = 'MEMBERSHIP'
        AND subscription_id IS NOT NULL
        AND fine_id IS NULL
        AND book_loan_id IS NULL)
    OR
    (payment_type = 'FINE'
        AND subscription_id IS NULL
        AND fine_id IS NOT NULL
        AND book_loan_id IS NOT NULL)
);

-- Bước 2: chỉ chạy ALTER TABLE sau khi kết quả bước 1 rỗng và đã xác nhận
-- CHECK này chưa tồn tại trong information_schema.table_constraints.
ALTER TABLE library_db1.payments
    ADD CONSTRAINT chk_payments_target CHECK (
        (payment_type = 'MEMBERSHIP'
            AND subscription_id IS NOT NULL
            AND fine_id IS NULL
            AND book_loan_id IS NULL)
        OR
        (payment_type = 'FINE'
            AND subscription_id IS NULL
            AND fine_id IS NOT NULL
            AND book_loan_id IS NOT NULL)
    );
