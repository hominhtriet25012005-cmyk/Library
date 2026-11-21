-- DRAFT FOR APPROVAL ONLY. Not applied to MySQL.
-- Target: library_db1, MySQL 9.2.
-- Run each reviewed statement separately after backup and fresh schema inspection.
-- Preconditions: subscription_plans is EMPTY; new columns/tables do not exist;
-- chk_payments_status still has the four original values.
-- If these preconditions change, STOP and prepare a reviewed data backfill.
-- MySQL DDL commits implicitly: wrapping this file in a transaction is not rollback protection.

-- Read-only preflight; examine the results before executing any DDL below.
SELECT COUNT(*) AS plan_count_must_be_zero FROM library_db1.subscription_plans;
SHOW CREATE TABLE library_db1.subscription_plans;
SHOW CREATE TABLE library_db1.payments;

-- 4A. Preserve all existing plan columns and DECIMAL price.
-- No invented borrowing limits or currency defaults for new required fields.
ALTER TABLE library_db1.subscription_plans
    ADD COLUMN plan_code VARCHAR(100) NOT NULL,
    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    ADD COLUMN max_books_allowed INT NOT NULL,
    ADD COLUMN max_days_per_book INT NOT NULL,
    ADD COLUMN display_order INT NOT NULL DEFAULT 0,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN badge_text VARCHAR(255) NULL,
    ADD COLUMN admin_notes VARCHAR(255) NULL,
    ADD COLUMN created_by VARCHAR(150) NULL,
    ADD COLUMN updated_by VARCHAR(150) NULL,
    ADD CONSTRAINT uq_subscription_plans_plan_code UNIQUE (plan_code),
    ADD CONSTRAINT chk_subscription_plans_max_books CHECK (max_books_allowed > 0),
    ADD CONSTRAINT chk_subscription_plans_max_days CHECK (max_days_per_book > 0);

-- 4B. Storage for existing review and password-reset features only.
CREATE TABLE library_db1.book_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    rating INT NOT NULL,
    review_text VARCHAR(2000) NOT NULL,
    title VARCHAR(200) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_book_reviews_user_book UNIQUE (user_id, book_id),
    CONSTRAINT fk_book_reviews_user FOREIGN KEY (user_id) REFERENCES library_db1.users(id),
    CONSTRAINT fk_book_reviews_book FOREIGN KEY (book_id) REFERENCES library_db1.books(id),
    CONSTRAINT chk_book_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_book_reviews_text CHECK (CHAR_LENGTH(review_text) BETWEEN 10 AND 2000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE library_db1.password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_password_reset_tokens_token UNIQUE (token),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES library_db1.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4C. Widen the existing CHECK; all previously accepted values remain accepted.
-- DROP CHECK replaces only a constraint, not a table or any rows.
-- REFUNDED is intentionally not added: no implemented refund flow has been confirmed.
ALTER TABLE library_db1.payments
    ALTER COLUMN currency SET DEFAULT 'VND',
    DROP CHECK chk_payments_status,
    ADD CONSTRAINT chk_payments_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'));
