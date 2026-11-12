-- Lược đồ MySQL chuẩn cho library_db1.
-- Đây là nguồn thông tin duy nhất và chính xác để tạo lược đồ cơ sở dữ liệu.
-- Các thông tin như người dùng hệ thống, thông tin đăng nhập của quản trị viên (ADMIN) và dữ liệu ứng dụng cố ý không được đưa vào đây.
CREATE DATABASE IF NOT EXISTS library_db1
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE library_db1;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(255) NOT NULL,

    password VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(30) NULL,

    profile_image VARCHAR(500) NULL,

    role VARCHAR(20) NOT NULL,

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    last_login DATETIME NULL,

    CONSTRAINT chk_users_role
        CHECK (
            role IN (
                'ROLE_ADMIN',
                'ROLE_USER'
            )
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS genres (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(100) NOT NULL,

    description VARCHAR(500),

    display_order INT NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    parent_genre_id BIGINT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_genres_parent
        FOREIGN KEY (parent_genre_id)
        REFERENCES genres(id),

    CONSTRAINT chk_genres_code_length
        CHECK (CHAR_LENGTH(code) BETWEEN 2 AND 50),

    CONSTRAINT chk_genres_name_length
        CHECK (CHAR_LENGTH(name) BETWEEN 2 AND 100),

    CONSTRAINT chk_genres_description_length
        CHECK (
            description IS NULL
            OR CHAR_LENGTH(description) <= 500
        ),

    CONSTRAINT chk_genres_code_format
        CHECK (code REGEXP '^[A-Z_]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    isbn VARCHAR(20) NULL UNIQUE,

    title VARCHAR(255) NOT NULL,

    author VARCHAR(255) NOT NULL,

    genre_id BIGINT NOT NULL,

    publisher VARCHAR(100),

    publication_date DATE,

    publication_year SMALLINT UNSIGNED NULL,

    language VARCHAR(20),

    pages INT,

    description VARCHAR(2000),

    total_copies INT NOT NULL DEFAULT 0,

    available_copies INT NOT NULL DEFAULT 0,

    price DECIMAL(10,2),

    cover_image_url VARCHAR(500),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_books_genre
        FOREIGN KEY (genre_id)
        REFERENCES genres(id),

    CONSTRAINT chk_books_pages
        CHECK (pages IS NULL OR (pages >= 1 AND pages <= 50000)),

    CONSTRAINT chk_books_total_copies
        CHECK (total_copies >= 0),

    CONSTRAINT chk_books_available_copies
        CHECK (
            available_copies >= 0
            AND available_copies <= total_copies
        ),

    CONSTRAINT chk_books_price
        CHECK (price IS NULL OR price >= 0),

    CONSTRAINT chk_books_publication_year_range
        CHECK (publication_year IS NULL OR publication_year BETWEEN 1 AND 9999),

    CONSTRAINT chk_books_publication_precision
        CHECK (publication_year IS NULL OR publication_date IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS subscription_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(150) NOT NULL UNIQUE,

    description VARCHAR(500) NULL,

    price DECIMAL(10,2) NOT NULL,

    duration_in_days INT NOT NULL,

    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',

    trial_days INT NOT NULL DEFAULT 0,

    max_users_allowed INT NOT NULL DEFAULT 1,

    features JSON NULL,

    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    plan_code VARCHAR(100) NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'VND',

    max_books_allowed INT NOT NULL,

    max_days_per_book INT NOT NULL,

    display_order INT NOT NULL DEFAULT 0,

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    badge_text VARCHAR(255) NULL,

    admin_notes VARCHAR(255) NULL,

    created_by VARCHAR(150) NULL,

    updated_by VARCHAR(150) NULL,

    CONSTRAINT uq_subscription_plans_plan_code UNIQUE (plan_code),

    CONSTRAINT chk_subscription_plans_price
        CHECK (price >= 0),

    CONSTRAINT chk_subscription_plans_duration
        CHECK (duration_in_days >= 1),

    CONSTRAINT chk_subscription_plans_trial_days
        CHECK (trial_days >= 0),

    CONSTRAINT chk_subscription_plans_max_users
        CHECK (max_users_allowed >= 1),

    CONSTRAINT chk_subscription_plans_billing_cycle
        CHECK (
            billing_cycle IN (
                'MONTHLY',
                'YEARLY',
                'ONE_TIME'
            )
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    plan_id BIGINT NOT NULL,

    plan_name VARCHAR(255),

    plan_code VARCHAR(100),

    price BIGINT NOT NULL,

    currency VARCHAR(3) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    max_books_allowed INT NOT NULL,

    max_days_per_book INT NOT NULL,

    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,

    cancelled_at DATETIME NULL,

    cancellation_reason TEXT NULL,

    notes TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_subscriptions_user_active_period
        (user_id, is_active, start_date, end_date),

    INDEX idx_subscriptions_active_end_date
        (is_active, end_date),

    CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_subscriptions_plan
        FOREIGN KEY (plan_id)
        REFERENCES subscription_plans(id),

    CONSTRAINT chk_subscriptions_price
        CHECK (price >= 0),

    CONSTRAINT chk_subscriptions_max_books
        CHECK (max_books_allowed > 0),

    CONSTRAINT chk_subscriptions_max_days
        CHECK (max_days_per_book > 0),

    CONSTRAINT chk_subscriptions_dates
        CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS book_loans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    book_id BIGINT NOT NULL,

    type VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL,

    checkout_date DATE NOT NULL,

    due_date DATE NOT NULL,

    return_date DATE NULL,

    return_requested_at DATETIME NULL,

    return_request_note VARCHAR(500) NULL,

    checked_in_at DATETIME NULL,

    checked_in_by BIGINT NULL,

    inspection_note VARCHAR(500) NULL,

    renewal_count INT NOT NULL DEFAULT 0,

    max_renewals INT NOT NULL DEFAULT 2,

    notes VARCHAR(500) NULL,

    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,

    overdue_days INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_book_loans_user_status
        (user_id, status),

    INDEX idx_book_loans_book_status
        (book_id, status),

    INDEX idx_book_loans_status_due_id
        (status, due_date, id),

    INDEX idx_book_loans_return_queue
        (checked_in_at, return_requested_at, id),

    CONSTRAINT fk_book_loans_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_book_loans_book
        FOREIGN KEY (book_id)
        REFERENCES books(id),

    CONSTRAINT fk_book_loans_checked_in_by
        FOREIGN KEY (checked_in_by)
        REFERENCES users(id),

    CONSTRAINT chk_book_loans_type
        CHECK (type IN ('CHECKOUT', 'RENEWAL', 'RETURN')),

    CONSTRAINT chk_book_loans_status
        CHECK (status IN ('CHECKED_OUT', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED')),

    CONSTRAINT chk_book_loans_renewal_count
        CHECK (renewal_count >= 0),

    CONSTRAINT chk_book_loans_max_renewals
        CHECK (max_renewals >= 0),

    CONSTRAINT chk_book_loans_overdue_days
        CHECK (overdue_days >= 0),

    CONSTRAINT chk_book_loans_due_date
        CHECK (due_date >= checkout_date),

    CONSTRAINT chk_book_loans_return_date
        CHECK (
            return_date IS NULL
            OR return_date >= checkout_date
        ),

    CONSTRAINT chk_book_loans_return_request_time
        CHECK (
            return_requested_at IS NULL
            OR return_requested_at >= checkout_date
        ),

    CONSTRAINT chk_book_loans_checkin_time
        CHECK (
            checked_in_at IS NULL
            OR (
                status IN ('RETURNED', 'LOST', 'DAMAGED')
                AND return_date IS NOT NULL
                AND (
                    return_requested_at IS NULL
                    OR checked_in_at >= return_requested_at
                )
            )
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS fines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    book_loan_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    type VARCHAR(30) NOT NULL,

    amount BIGINT NOT NULL,

    amount_paid BIGINT NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    reason VARCHAR(500),

    notes VARCHAR(1000),

    waived_by BIGINT NULL,

    waived_at DATETIME NULL,

    waiver_reason VARCHAR(500),

    paid_at DATETIME NULL,

    processed_by BIGINT NULL,

    transaction_id VARCHAR(100),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_fines_user_status_type_created
        (user_id, status, type, created_at),

    UNIQUE INDEX uq_fines_book_loan_type
        (book_loan_id, type),

    CONSTRAINT fk_fines_book_loan
        FOREIGN KEY (book_loan_id)
        REFERENCES book_loans(id),

    CONSTRAINT fk_fines_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_fines_waived_by
        FOREIGN KEY (waived_by)
        REFERENCES users(id),

    CONSTRAINT fk_fines_processed_by
        FOREIGN KEY (processed_by)
        REFERENCES users(id),

    CONSTRAINT chk_fines_type
        CHECK (type IN ('OVERDUE', 'DAMAGE', 'LOSS', 'PROCESSING')),

    CONSTRAINT chk_fines_status
        CHECK (status IN ('PENDING', 'PARTIALLY_PAID', 'PAID', 'WAIVED')),

    CONSTRAINT chk_fines_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_fines_amount_paid
        CHECK (
            amount_paid >= 0
            AND amount_paid <= amount
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    book_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    reserved_at DATETIME NOT NULL,

    available_at DATETIME NULL,

    available_until DATETIME NULL,

    fulfilled_at DATETIME NULL,

    cancelled_at DATETIME NULL,

    queue_position INT NULL,

    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,

    notes TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_reservations_book_status_queue
        (book_id, status, reserved_at, id),

    INDEX idx_reservations_user_book_status
        (user_id, book_id, status),

    CONSTRAINT fk_reservations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_reservations_book
        FOREIGN KEY (book_id)
        REFERENCES books(id),

    CONSTRAINT chk_reservations_status
        CHECK (status IN ('PENDING', 'AVAILABLE', 'FULFILLED', 'CANCELLED', 'EXPIRED')),

    CONSTRAINT chk_reservations_queue_position
        CHECK (
            queue_position IS NULL
            OR queue_position >= 1
        ),

    CONSTRAINT chk_reservations_available_until
        CHECK (
            available_until IS NULL
            OR available_at IS NULL
            OR available_until >= available_at
        ),

    CONSTRAINT chk_reservations_fulfilled_at
        CHECK (
            fulfilled_at IS NULL
            OR fulfilled_at >= reserved_at
        ),

    CONSTRAINT chk_reservations_cancelled_at
        CHECK (
            cancelled_at IS NULL
            OR cancelled_at >= reserved_at
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    book_id BIGINT NOT NULL,

    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes VARCHAR(500) NULL,

    CONSTRAINT fk_wishlists_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_wishlists_book
        FOREIGN KEY (book_id)
        REFERENCES books(id),

    CONSTRAINT uq_wishlists_user_book
        UNIQUE (user_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS book_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    rating INT NOT NULL,
    review_text VARCHAR(2000) NOT NULL,
    title VARCHAR(200) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_book_reviews_book_active_created (book_id, is_active, created_at),
    CONSTRAINT uq_book_reviews_user_book UNIQUE (user_id, book_id),
    CONSTRAINT fk_book_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_book_reviews_book FOREIGN KEY (book_id) REFERENCES books(id),
    CONSTRAINT chk_book_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_book_reviews_text CHECK (CHAR_LENGTH(review_text) BETWEEN 10 AND 2000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_password_reset_tokens_token UNIQUE (token),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    book_loan_id BIGINT NULL,

    subscription_id BIGINT NULL,

    fine_id BIGINT NULL,

    payment_type VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL,

    gateway VARCHAR(30) NOT NULL,

    amount BIGINT NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'VND',

    transaction_id VARCHAR(255) NULL,

    gateway_payment_id VARCHAR(255) NULL,

    gateway_order_id VARCHAR(255) NULL,

    gateway_signature VARCHAR(500) NULL,

    payment_method VARCHAR(100) NULL,

    metadata JSON NULL,

    description TEXT NULL,

    failure_reason TEXT NULL,

    retry_count INT NOT NULL DEFAULT 0,

    initiated_at DATETIME NOT NULL,

    completed_at DATETIME NULL,

    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_payments_transaction_id
        UNIQUE (transaction_id),

    CONSTRAINT uq_payments_gateway_order_id
        UNIQUE (gateway_order_id),

    INDEX idx_payments_fine_gateway_id
        (fine_id, gateway, id),

    INDEX idx_payments_subscription_gateway_id
        (subscription_id, gateway, id),

    CONSTRAINT fk_payments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_payments_book_loan
        FOREIGN KEY (book_loan_id)
        REFERENCES book_loans(id),

    CONSTRAINT fk_payments_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(id),

    CONSTRAINT fk_payments_fine
        FOREIGN KEY (fine_id)
        REFERENCES fines(id),

    CONSTRAINT chk_payments_amount
        CHECK (amount > 0),

    CONSTRAINT chk_payments_retry_count
        CHECK (retry_count >= 0),

    CONSTRAINT chk_payments_payment_type
        CHECK (
            payment_type IN (
                'FINE',
                'MEMBERSHIP',
                'LOST_BOOK_PENALTY',
                'DAMAGED_BOOK_PENALTY'
            )
        ),

    CONSTRAINT chk_payments_status
        CHECK (
            status IN (
                'PENDING',
                'PROCESSING',
                'SUCCESS',
                'FAILED',
                'CANCELLED',
                'REFUNDED'
            )
        ),

    CONSTRAINT chk_payments_gateway
        CHECK (
            gateway = 'PAYOS'
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
