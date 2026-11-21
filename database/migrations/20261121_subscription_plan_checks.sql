-- Migration một lần cho Database cũ đã có bảng subscription_plans.
-- Chỉ áp dụng sau khi sao lưu, khi truy vấn kiểm tra không trả về dòng nào,
-- và khi ràng buộc giá cũ chk_subscription_plans_price đang là price >= 0.
-- Không chạy file này trên Database mới được tạo từ library_db1.sql.
-- Migration này chỉ bổ sung ràng buộc; không sửa hay xóa dữ liệu.

-- Bước 1: chạy truy vấn dưới đây riêng. Kết quả phải rỗng.
SELECT id, title, price, currency, max_books_allowed, max_days_per_book
FROM library_db1.subscription_plans
WHERE price <= 0
   OR price <> FLOOR(price)
   OR BINARY currency <> BINARY 'VND'
   OR max_books_allowed <= 0
   OR max_days_per_book <= 0;

-- Bước 2: chỉ chạy ALTER TABLE sau khi kết quả bước 1 rỗng và đã xác nhận
-- Database còn ràng buộc giá cũ, chưa có ba ràng buộc còn thiếu.
ALTER TABLE library_db1.subscription_plans
    DROP CHECK chk_subscription_plans_price,
    ADD CONSTRAINT chk_subscription_plans_price
        CHECK (price > 0 AND price = FLOOR(price)),
    ADD CONSTRAINT chk_subscription_plans_currency
        CHECK (BINARY currency = BINARY 'VND'),
    ADD CONSTRAINT chk_subscription_plans_max_books
        CHECK (max_books_allowed > 0),
    ADD CONSTRAINT chk_subscription_plans_max_days_per_book
        CHECK (max_days_per_book > 0);
