package com.library;

import org.junit.jupiter.api.Test;
import java.sql.*;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

/** Opt-in metadata check against MySQL. Does not insert/update payment records. */
class PaymentSchemaContractIT {
    @Test void currentCatalogHasExpectedTablesAndCriticalConstraints() throws Exception {
        Properties config = new Properties();
        try (var input = getClass().getResourceAsStream("/application.properties")) { config.load(input); }
        try (var connection = DriverManager.getConnection(config.getProperty("spring.datasource.url"),
                config.getProperty("spring.datasource.username"), config.getProperty("spring.datasource.password"))) {
            connection.setReadOnly(true);
            connection.setAutoCommit(false);
            try (var statement = connection.createStatement()) {
                try (var result = statement.executeQuery("SELECT DATABASE()")) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString(1)).isEqualTo("library_db1");
                }
                Set<String> tables = new HashSet<>();
                try (var result = statement.executeQuery("""
                    SELECT TABLE_NAME FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'
                    """)) {
                    while (result.next()) tables.add(result.getString(1));
                }
                assertThat(tables).containsExactlyInAnyOrder("users", "genres", "books", "subscription_plans",
                    "subscriptions", "book_loans", "fines", "reservations", "wishlists", "payments",
                    "book_reviews", "password_reset_tokens");

                Set<String> constraints = new HashSet<>();
                try (var result = statement.executeQuery("""
                    SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA=DATABASE()
                    """)) {
                    while (result.next()) constraints.add(result.getString(1));
                }
                assertThat(constraints).contains("fk_books_genre", "fk_book_loans_user", "fk_book_loans_book",
                    "fk_reservations_user", "fk_reservations_book", "fk_payments_user", "fk_payments_fine",
                    "uq_wishlists_user_book", "uq_book_reviews_user_book", "uq_password_reset_tokens_token",
                    "uq_payments_transaction_id", "uq_payments_gateway_order_id",
                    "chk_users_role", "chk_users_auth_provider", "chk_books_available_copies",
                    "chk_book_loans_type", "chk_book_loans_status", "chk_book_loans_due_date",
                    "chk_fines_type", "chk_fines_status", "chk_reservations_status",
                    "chk_reservations_queue_position", "chk_payments_amount", "chk_payments_payment_type",
                    "chk_payments_status", "chk_payments_gateway", "chk_book_reviews_rating");

                Map<String, List<String>> indexes = new HashMap<>();
                try (var result = statement.executeQuery("""
                    SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA=DATABASE()
                    ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
                    """)) {
                    while (result.next()) {
                        String key = result.getString(1) + "." + result.getString(2);
                        indexes.computeIfAbsent(key, ignored -> new ArrayList<>()).add(result.getString(3));
                    }
                }
                assertThat(indexes)
                    .containsEntry("payments.idx_payments_fine_gateway_id", List.of("fine_id", "gateway", "id"))
                    .containsEntry("payments.idx_payments_subscription_gateway_id", List.of("subscription_id", "gateway", "id"))
                    .containsEntry("subscriptions.idx_subscriptions_user_active_period", List.of("user_id", "is_active", "start_date", "end_date"))
                    .containsEntry("subscriptions.idx_subscriptions_active_end_date", List.of("is_active", "end_date"))
                    .containsEntry("book_loans.idx_book_loans_user_status", List.of("user_id", "status"))
                    .containsEntry("book_loans.idx_book_loans_book_status", List.of("book_id", "status"))
                    .containsEntry("book_loans.idx_book_loans_status_due_id", List.of("status", "due_date", "id"))
                    .containsEntry("reservations.idx_reservations_book_status_queue", List.of("book_id", "status", "reserved_at", "id"))
                    .containsEntry("reservations.idx_reservations_user_book_status", List.of("user_id", "book_id", "status"))
                    .containsEntry("fines.idx_fines_user_status_type_created", List.of("user_id", "status", "type", "created_at"))
                    .containsEntry("book_reviews.idx_book_reviews_book_active_created", List.of("book_id", "is_active", "created_at"));

                try (var result = statement.executeQuery("""
                    SELECT IS_NULLABLE FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='books' AND COLUMN_NAME='isbn'
                    """)) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString(1)).isEqualTo("YES");
                }
            } finally { connection.rollback(); }
        }
    }

    @Test void paymentCheckAndDefaultMatchSupportedPayOSStates() throws Exception {
        Properties config = new Properties();
        try (var input = getClass().getResourceAsStream("/application.properties")) { config.load(input); }
        try (var connection = DriverManager.getConnection(config.getProperty("spring.datasource.url"),
                config.getProperty("spring.datasource.username"), config.getProperty("spring.datasource.password"))) {
            connection.setReadOnly(true);
            connection.setAutoCommit(false);
            try (var statement = connection.createStatement()) {
                try (var result = statement.executeQuery("""
                    SELECT COLUMN_DEFAULT, COLUMN_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payments' AND COLUMN_NAME='currency'
                    """)) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString(1)).isEqualTo("VND");
                    assertThat(result.getString(2)).isEqualTo("varchar(3)");
                    assertThat(result.getString(3)).isEqualTo("NO");
                }
                try (var result = statement.executeQuery("""
                    SELECT c.CHECK_CLAUSE, t.ENFORCED FROM information_schema.CHECK_CONSTRAINTS c
                    JOIN information_schema.TABLE_CONSTRAINTS t
                    ON c.CONSTRAINT_SCHEMA=t.CONSTRAINT_SCHEMA AND c.CONSTRAINT_NAME=t.CONSTRAINT_NAME
                    WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='payments'
                    AND t.CONSTRAINT_NAME='chk_payments_status'
                    """)) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString(2)).isEqualTo("YES");
                    // MySQL information_schema escapes literal quotes, unlike SHOW CREATE TABLE.
                    String clause = result.getString(1).replace("\\'", "'");
                    var matcher = java.util.regex.Pattern.compile("'([A-Z_]+)'").matcher(clause);
                    Set<String> states = new HashSet<>();
                    while (matcher.find()) states.add(matcher.group(1));
                    assertThat(states).as("Stored CHECK: %s", clause).containsExactlyInAnyOrder(
                            "PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED");
                }
                try (var result = statement.executeQuery("""
                    SELECT c.CHECK_CLAUSE, t.ENFORCED FROM information_schema.CHECK_CONSTRAINTS c
                    JOIN information_schema.TABLE_CONSTRAINTS t
                    ON c.CONSTRAINT_SCHEMA=t.CONSTRAINT_SCHEMA AND c.CONSTRAINT_NAME=t.CONSTRAINT_NAME
                    WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='payments'
                    AND t.CONSTRAINT_NAME='chk_payments_gateway'
                    """)) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString(2)).isEqualTo("YES");
                    String clause = result.getString(1).replace("\\'", "'");
                    var matcher = java.util.regex.Pattern.compile("'([A-Z_]+)'").matcher(clause);
                    Set<String> gateways = new HashSet<>();
                    while (matcher.find()) gateways.add(matcher.group(1));
                    assertThat(gateways).as("Stored CHECK: %s", clause).containsExactly("PAYOS");
                }
            } finally { connection.rollback(); }
        }
    }
}
