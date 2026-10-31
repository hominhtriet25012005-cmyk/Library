package com.library;

import com.library.exception.BookException;
import com.library.payload.request.CheckoutRequest;
import com.library.payload.request.ReservationRequest;
import com.library.service.BookLoanService;
import com.library.service.ReservationService;
import com.library.service.impl.PayOSSettlementService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Opt-in committed-transaction and race tests against the user's explicitly approved primary DB.
 * Refuses to run unless every application table is empty; fixtures are committed, uniquely named,
 * then deleted by their exact generated IDs/foreign-key scope in @AfterEach.
 */
@EnabledIfSystemProperty(named = "step6.mysql.commit", matches = "true")
@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=validate", "spring.sql.init.mode=never",
    "app.initialize-admin=false", "payos.enabled=false", "payos.creation-enabled=false",
    "app.jwt.secret=test-only-jwt-secret-with-at-least-32-bytes", "app.jwt.expiration-ms=60000",
    "spring.jpa.show-sql=false", "spring.datasource.hikari.read-only=false",
    "spring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=OFF"
})
class Step6GCommitRaceMySqlIT {
    private static final List<String> TABLES = List.of("users", "genres", "books", "book_loans", "fines",
        "reservations", "subscriptions", "subscription_plans", "payments", "wishlists", "book_reviews",
        "password_reset_tokens");

    @Autowired JdbcTemplate jdbc;
    @Autowired BookLoanService bookLoans;
    @Autowired ReservationService reservations;
    @Autowired PayOSSettlementService settlement;
    @Autowired PlatformTransactionManager transactionManager;

    private Fixture fixture;

    @BeforeEach void requireEmptyPrimaryDatabase() {
        assertEquals("library_db1", jdbc.queryForObject("SELECT DATABASE()", String.class),
            "G-03 fixture tests are hard-bound to the approved library_db1 database");
        for (String table : TABLES) {
            assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM `" + table + "`", Long.class),
                "Safety stop: library_db1 is not empty; no committed fixture will be written");
        }
    }

    @AfterEach void removeOnlyThisTestFixturesAndVerifyEmpty() {
        try {
            if (fixture != null) {
                if (fixture.paymentId != null) jdbc.update("DELETE FROM payments WHERE id=?", fixture.paymentId);
                if (!fixture.userIds.isEmpty()) {
                    String marks = String.join(",", java.util.Collections.nCopies(fixture.userIds.size(), "?"));
                    Object[] users = fixture.userIds.toArray();
                    jdbc.update("DELETE FROM fines WHERE user_id IN (" + marks + ")", users);
                    jdbc.update("DELETE FROM book_reviews WHERE user_id IN (" + marks + ")", users);
                    jdbc.update("DELETE FROM wishlists WHERE user_id IN (" + marks + ")", users);
                    jdbc.update("DELETE FROM reservations WHERE user_id IN (" + marks + ")", users);
                    jdbc.update("DELETE FROM book_loans WHERE user_id IN (" + marks + ")", users);
                    jdbc.update("DELETE FROM subscriptions WHERE user_id IN (" + marks + ")", users);
                }
                if (fixture.bookId != null) {
                    jdbc.update("DELETE FROM fines WHERE book_loan_id IN " +
                        "(SELECT id FROM book_loans WHERE book_id=?)", fixture.bookId);
                    jdbc.update("DELETE FROM book_reviews WHERE book_id=?", fixture.bookId);
                    jdbc.update("DELETE FROM wishlists WHERE book_id=?", fixture.bookId);
                    jdbc.update("DELETE FROM reservations WHERE book_id=?", fixture.bookId);
                    jdbc.update("DELETE FROM book_loans WHERE book_id=?", fixture.bookId);
                }
                if (fixture.planId != null) jdbc.update("DELETE FROM subscription_plans WHERE id=?", fixture.planId);
                if (fixture.bookId != null) jdbc.update("DELETE FROM books WHERE id=?", fixture.bookId);
                if (fixture.genreId != null) jdbc.update("DELETE FROM genres WHERE id=?", fixture.genreId);
                if (!fixture.userIds.isEmpty()) {
                    String marks = String.join(",", java.util.Collections.nCopies(fixture.userIds.size(), "?"));
                    jdbc.update("DELETE FROM password_reset_tokens WHERE user_id IN (" + marks + ")", fixture.userIds.toArray());
                    jdbc.update("DELETE FROM users WHERE id IN (" + marks + ")", fixture.userIds.toArray());
                }
            }
        } finally {
            fixture = null;
        }
        assertDatabaseEmpty("After G-03 fixture cleanup");
    }

    @Test void rollbackAfterCheckoutRestoresInventoryAndLeavesNoLoan() {
        fixture = createFixture(1, true, true);
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        assertThrows(ForcedRollback.class, () -> tx.executeWithoutResult(status -> {
            try {
                withUser(fixture.emails.get(0), () -> bookLoans.checkoutBookForUser(
                    fixture.userIds.get(0), checkout(fixture.bookId)));
            } catch (Exception e) { throw new RuntimeException(e); }
            throw new ForcedRollback();
        }));
        assertEquals(1, jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?", Integer.class, fixture.bookId));
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM book_loans WHERE book_id=?", Long.class, fixture.bookId));
    }

    @Test void concurrentCheckoutCannotBorrowTheLastCopyTwice() throws Exception {
        fixture = createFixture(2, true, true);
        var results = race(
            () -> tryCheckout(0),
            () -> tryCheckout(1));
        assertEquals(1L, results.stream().filter(Boolean::booleanValue).count(), "Exactly one checkout may obtain the only copy");
        assertEquals(0, jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?", Integer.class, fixture.bookId));
        assertEquals(1L, jdbc.queryForObject("SELECT COUNT(*) FROM book_loans WHERE book_id=? AND status='CHECKED_OUT'", Long.class, fixture.bookId));
    }

    @Test void concurrentReservationsKeepDistinctOrderedQueuePositions() throws Exception {
        fixture = createFixture(2, false, false);
        var created = race(() -> createReservation(0), () -> createReservation(1));
        assertEquals(2, created.stream().filter(Boolean::booleanValue).count());
        List<Integer> positions = jdbc.query("SELECT queue_position FROM reservations WHERE book_id=? ORDER BY queue_position",
            (rs, row) -> rs.getInt(1), fixture.bookId);
        assertEquals(List.of(1, 2), positions, "Serialized arrivals must not receive duplicate queue positions");
    }

    @Test void concurrentVerifiedPaymentCallbacksActivateMembershipExactlyOnce() throws Exception {
        fixture = createFixture(1, false, false);
        long subscriptionId = insert("""
            INSERT INTO subscriptions(user_id,plan_id,plan_name,plan_code,price,currency,start_date,end_date,
                is_active,max_books_allowed,max_days_per_book,auto_renew)
            VALUES(?,?,?,?,?,'VND',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 30 DAY),0,1,7,0)
            """, fixture.userIds.get(0), fixture.planId, "G03 membership", fixture.planCode, 20000L);
        fixture.subscriptionIds.add(subscriptionId);
        fixture.paymentId = insert("""
            INSERT INTO payments(user_id,subscription_id,payment_type,status,gateway,amount,currency,initiated_at)
            VALUES(?,?,'MEMBERSHIP','PENDING','PAYOS',20000,'VND',CURRENT_TIMESTAMP)
            """, fixture.userIds.get(0), subscriptionId);

        var results = race(() -> completePayment(), () -> completePayment());
        assertEquals(2, results.stream().filter(Boolean::booleanValue).count(), "Same verified receipt should be idempotent");
        assertEquals("SUCCESS", jdbc.queryForObject("SELECT status FROM payments WHERE id=?", String.class, fixture.paymentId));
        assertEquals(1, jdbc.queryForObject("SELECT is_active FROM subscriptions WHERE id=?", Integer.class, subscriptionId));
        assertEquals(1L, jdbc.queryForObject("SELECT COUNT(*) FROM payments WHERE id=? AND gateway_payment_id='G03_RECEIPT'", Long.class, fixture.paymentId));
    }

    private boolean completePayment() {
        try {
            settlement.complete(fixture.paymentId, "G03_LINK", 20000L, "VND", "G03_RECEIPT");
            return true;
        } catch (RuntimeException e) { throw e; }
    }

    private boolean tryCheckout(int userIndex) throws Exception {
        try {
            withUser(fixture.emails.get(userIndex), () -> bookLoans.checkoutBookForUser(
                fixture.userIds.get(userIndex), checkout(fixture.bookId)));
            return true;
        } catch (BookException expected) { return false; }
    }

    private boolean createReservation(int userIndex) throws Exception {
        ReservationRequest request = new ReservationRequest();
        request.setBookId(fixture.bookId);
        withUser(fixture.emails.get(userIndex), () -> reservations.createReservationForUser(request, fixture.userIds.get(userIndex)));
        return true;
    }

    private CheckoutRequest checkout(long bookId) {
        CheckoutRequest request = new CheckoutRequest();
        request.setBookId(bookId);
        request.setCheckoutDays(7);
        return request;
    }

    private <T> T withUser(String email, Callable<T> action) throws Exception {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(email, "test",
            List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        SecurityContextHolder.setContext(context);
        try { return action.call(); }
        finally { SecurityContextHolder.clearContext(); }
    }

    private <T> List<T> race(Callable<T> left, Callable<T> right) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<T> a = pool.submit(() -> { assertTrue(start.await(10, TimeUnit.SECONDS)); return left.call(); });
            Future<T> b = pool.submit(() -> { assertTrue(start.await(10, TimeUnit.SECONDS)); return right.call(); });
            start.countDown();
            return List.of(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
        } finally {
            pool.shutdownNow();
            assertTrue(pool.awaitTermination(10, TimeUnit.SECONDS), "Concurrent transaction did not terminate");
        }
    }

    private Fixture createFixture(int users, boolean available, boolean activeMemberships) {
        fixture = new Fixture();
        String rawToken = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        StringBuilder lettersOnly = new StringBuilder(rawToken.length());
        for (char c : rawToken.toCharArray()) lettersOnly.append(Character.isDigit(c) ? (char) ('Q' + c - '0') : c);
        String token = lettersOnly.toString();
        fixture.planCode = "G3_" + token;
        fixture.genreId = insert("INSERT INTO genres(code,name) VALUES(?,?)", "GENRE_" + token, "G03 test genre");
        fixture.planId = insert("""
            INSERT INTO subscription_plans(plan_code,title,price,duration_in_days,billing_cycle,trial_days,
                max_users_allowed,auto_renew,active,currency,max_books_allowed,max_days_per_book)
            VALUES(?,?,20000,30,'MONTHLY',0,1,0,1,'VND',1,7)
            """, fixture.planCode, "G03 test plan " + token);
        for (int i = 0; i < users; i++) {
            String email = "g03-" + token.toLowerCase() + "-" + i + "@example.invalid";
            long userId = insert("INSERT INTO users(full_name,email,role,auth_provider) VALUES(?,?,'ROLE_USER','LOCAL')",
                "G03 temporary user", email);
            fixture.userIds.add(userId);
            fixture.emails.add(email);
            if (activeMemberships) {
                long subscriptionId = insert("""
                    INSERT INTO subscriptions(user_id,plan_id,plan_name,plan_code,price,currency,start_date,end_date,
                        is_active,max_books_allowed,max_days_per_book,auto_renew)
                    VALUES(?,?,?,?,?,'VND',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 30 DAY),1,1,7,0)
                    """, userId, fixture.planId, "G03 membership", fixture.planCode, 20000L);
                fixture.subscriptionIds.add(subscriptionId);
            }
        }
        fixture.bookId = insert("""
            INSERT INTO books(isbn,title,author,genre_id,total_copies,available_copies,active)
            VALUES(?,?,?, ?,1,?,1)
            """, "G3-" + token, "G03 test book", "G03 test author", fixture.genreId, available ? 1 : 0);
        return fixture;
    }

    private long insert(String sql, Object... values) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < values.length; i++) statement.setObject(i + 1, values[i]);
            return statement;
        }, keys);
        Number key = keys.getKey();
        assertNotNull(key, "Fixture insert did not return an ID");
        return key.longValue();
    }

    private void assertDatabaseEmpty(String phase) {
        for (String table : TABLES) {
            assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM `" + table + "`", Long.class),
                phase + ": found rows in " + table);
        }
    }

    private static final class Fixture {
        Long genreId;
        Long planId;
        Long bookId;
        Long paymentId;
        String planCode;
        final List<Long> userIds = new ArrayList<>();
        final List<Long> subscriptionIds = new ArrayList<>();
        final List<String> emails = new ArrayList<>();
    }

    private static final class ForcedRollback extends RuntimeException {}
}
