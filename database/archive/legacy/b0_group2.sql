-- B0 group 2 only. Approved 2026-10-04; use guarded runner, never run entire stage4 proposal.
-- Creates missing tables only; no modification of existing tables/data.
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
