package com.library;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.Statement;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** Opt-in HTTP end-to-end smoke on MySQL; gateway calls are disabled and fixtures are always cleaned. */
@EnabledIfSystemProperty(named = "step6.mysql.commit", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.jpa.hibernate.ddl-auto=validate", "spring.sql.init.mode=never",
    "app.initialize-admin=false", "payos.enabled=false", "payos.creation-enabled=false",
    "app.jwt.secret=test-only-jwt-secret-with-at-least-32-bytes", "app.jwt.expiration-ms=60000",
    "spring.jpa.show-sql=false", "spring.datasource.hikari.read-only=false",
    "spring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=OFF"
})
class Step6HLiveApiMySqlIT {
    private static final String PASSWORD = "Step6H-Live-Smoke-Password!";
    private static final List<String> TABLES = List.of("users", "genres", "books", "book_loans", "fines",
        "reservations", "subscriptions", "subscription_plans", "payments", "wishlists", "book_reviews",
        "password_reset_tokens");

    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder passwordEncoder;
    @LocalServerPort int port;
    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    private Fixture fixture;

    @BeforeEach void requireEmptyDatabaseAndSeedFixtures() {
        assertEquals("library_db1", jdbc.queryForObject("SELECT DATABASE()", String.class),
            "Live API tests are hard-bound to the explicitly approved library_db1");
        assertDatabaseEmpty("Before live HTTP test");
        fixture = new Fixture();
        String token = alphaToken();
        fixture.memberEmail = "6h-member-" + token.toLowerCase() + "@example.invalid";
        fixture.adminEmail = "6h-admin-" + token.toLowerCase() + "@example.invalid";
        fixture.planCode = "G6H_" + token;
        fixture.apiPlanCode = "G6H_API_" + token;

        fixture.memberId = insert("INSERT INTO users(full_name,email,password,role,auth_provider) VALUES(?, ?, ?, 'ROLE_USER','LOCAL')",
            "6H temporary member", fixture.memberEmail, passwordEncoder.encode(PASSWORD));
        fixture.userIds.add(fixture.memberId);
        fixture.adminId = insert("INSERT INTO users(full_name,email,password,role,auth_provider) VALUES(?, ?, ?, 'ROLE_ADMIN','LOCAL')",
            "6H temporary admin", fixture.adminEmail, passwordEncoder.encode(PASSWORD));
        fixture.userIds.add(fixture.adminId);
        fixture.genreId = insert("INSERT INTO genres(code,name) VALUES(?,?)", "GENRE_" + token, "6H test genre");
        fixture.planId = insert("""
            INSERT INTO subscription_plans(plan_code,title,price,duration_in_days,billing_cycle,trial_days,
                max_users_allowed,auto_renew,active,currency,max_books_allowed,max_days_per_book)
            VALUES(?,?,20000,30,'MONTHLY',0,1,0,1,'VND',3,7)
            """, fixture.planCode, "6H active plan " + token);
        fixture.subscriptionId = insert("""
            INSERT INTO subscriptions(user_id,plan_id,plan_name,plan_code,price,currency,start_date,end_date,
                is_active,max_books_allowed,max_days_per_book,auto_renew)
            VALUES(?,?,?,?,?,'VND',CURDATE(),DATE_ADD(CURDATE(),INTERVAL 30 DAY),1,3,7,0)
            """, fixture.memberId, fixture.planId, "6H active plan", fixture.planCode, 20000L);
        fixture.availableBookId = insert("""
            INSERT INTO books(isbn,title,author,genre_id,total_copies,available_copies,active)
            VALUES(?,?,?, ?,3,3,1)
            """, "6H-" + token, "6H checkout book", "6H test author", fixture.genreId);
        fixture.reservationBookId = insert("""
            INSERT INTO books(isbn,title,author,genre_id,total_copies,available_copies,active)
            VALUES(?,?,?, ?,1,0,1)
            """, "6HR-" + token, "6H reservation book", "6H test author", fixture.genreId);
        fixture.paymentId = insert("""
            INSERT INTO payments(user_id,subscription_id,payment_type,status,gateway,amount,currency,initiated_at)
            VALUES(?,?,'MEMBERSHIP','PENDING','PAYOS',20000,'VND',CURRENT_TIMESTAMP)
            """, fixture.memberId, fixture.subscriptionId);
    }

    @AfterEach void cleanupExactFixturesAndCheckDatabase() {
        try {
            if (fixture != null) {
                if (fixture.paymentId != null) jdbc.update("DELETE FROM payments WHERE id=?", fixture.paymentId);
                if (!fixture.userIds.isEmpty()) {
                    String marks = marks(fixture.userIds.size());
                    Object[] ids = fixture.userIds.toArray();
                    jdbc.update("DELETE FROM fines WHERE user_id IN (" + marks + ")", ids);
                    jdbc.update("DELETE FROM book_reviews WHERE user_id IN (" + marks + ")", ids);
                    jdbc.update("DELETE FROM wishlists WHERE user_id IN (" + marks + ")", ids);
                    jdbc.update("DELETE FROM reservations WHERE user_id IN (" + marks + ")", ids);
                    jdbc.update("DELETE FROM book_loans WHERE user_id IN (" + marks + ")", ids);
                    jdbc.update("DELETE FROM subscriptions WHERE user_id IN (" + marks + ")", ids);
                }
                if (fixture.availableBookId != null) cleanupBookRows(fixture.availableBookId);
                if (fixture.reservationBookId != null) cleanupBookRows(fixture.reservationBookId);
                if (fixture.subscriptionId != null) jdbc.update("DELETE FROM subscriptions WHERE id=?", fixture.subscriptionId);
                if (fixture.planId != null) jdbc.update("DELETE FROM subscription_plans WHERE id=?", fixture.planId);
                if (fixture.apiPlanCode != null) jdbc.update("DELETE FROM subscription_plans WHERE plan_code=?", fixture.apiPlanCode);
                if (fixture.availableBookId != null) jdbc.update("DELETE FROM books WHERE id=?", fixture.availableBookId);
                if (fixture.reservationBookId != null) jdbc.update("DELETE FROM books WHERE id=?", fixture.reservationBookId);
                if (fixture.genreId != null) jdbc.update("DELETE FROM genres WHERE id=?", fixture.genreId);
                if (!fixture.userIds.isEmpty()) {
                    String marks = marks(fixture.userIds.size());
                    jdbc.update("DELETE FROM password_reset_tokens WHERE user_id IN (" + marks + ")", fixture.userIds.toArray());
                    jdbc.update("DELETE FROM users WHERE id IN (" + marks + ")", fixture.userIds.toArray());
                }
            }
        } finally { fixture = null; }
        assertDatabaseEmpty("After live HTTP test cleanup");
    }

    @Test void localHttpFlowsReachAuthCatalogMembershipLoanReturnReviewReservationFineAndPayment() throws Exception {
        String member = login(fixture.memberEmail);
        String admin = login(fixture.adminEmail);

        assertTrue(call("GET", "/api/subscription-plans", member, null, 200).isArray());
        assertEquals(fixture.subscriptionId, call("GET", "/api/subscriptions/user/active", member, null, 200).path("id").asLong());

        JsonNode newPlan = call("POST", "/api/subscription-plans/admin/create", admin, """
            {"planCode":"%s","name":"6H disabled-gateway plan","durationDays":30,"price":25000,
             "currency":"VND","maxBooksAllowed":2,"maxDaysPerBook":7,"displayOrder":0,
             "isActive":true,"isFeatured":false}
            """.formatted(fixture.apiPlanCode), 200);
        long newPlanId = newPlan.path("id").asLong();
        assertTrue(newPlanId > 0);
        call("POST", "/api/subscriptions/subscribe", member,
            "{\"planId\":" + newPlanId + "}", 503);
        assertEquals(1L, jdbc.queryForObject("SELECT COUNT(*) FROM subscriptions", Long.class),
            "When PayOS is disabled, subscribe must not leave a draft subscription");
        assertEquals(1L, jdbc.queryForObject("SELECT COUNT(*) FROM payments", Long.class),
            "No payment row should be created when checkout is disabled");

        JsonNode loan = call("POST", "/api/book-loans/checkout", member,
            "{\"bookId\":" + fixture.availableBookId + ",\"checkoutDays\":7}", 201);
        long loanId = loan.path("id").asLong();
        assertTrue(loanId > 0);
        assertEquals(2, jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?", Integer.class, fixture.availableBookId));
        call("POST", "/api/book-loans/checkin", member,
            "{\"bookLoanId\":" + loanId + ",\"condition\":\"RETURNED\"}", 200);
        assertEquals("RETURNED", jdbc.queryForObject("SELECT status FROM book_loans WHERE id=?", String.class, loanId));
        assertEquals(3, jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?", Integer.class, fixture.availableBookId));

        JsonNode review = call("POST", "/api/reviews", member,
            "{\"bookId\":" + fixture.availableBookId + ",\"rating\":5,\"reviewText\":\"Verified live HTTP review\",\"title\":\"6H review\"}", 201);
        assertTrue(review.path("id").asLong() > 0);

        JsonNode reservation = call("POST", "/api/reservations", member,
            "{\"bookId\":" + fixture.reservationBookId + ",\"notes\":\"6H live smoke\"}", 200);
        long reservationId = reservation.path("id").asLong();
        assertEquals("PENDING", jdbc.queryForObject("SELECT status FROM reservations WHERE id=?", String.class, reservationId));
        call("DELETE", "/api/reservations/" + reservationId, member, null, 200);
        assertEquals("CANCELLED", jdbc.queryForObject("SELECT status FROM reservations WHERE id=?", String.class, reservationId));

        call("POST", "/api/fines", admin,
            "{\"bookLoanId\":" + loanId + ",\"type\":\"OVERDUE\",\"amount\":10000,\"reason\":\"6H HTTP smoke\"}", 200);
        long fineId = jdbc.queryForObject("SELECT id FROM fines WHERE book_loan_id=?", Long.class, loanId);
        call("POST", "/api/fines/waive", admin,
            "{\"fineId\":" + fineId + ",\"reason\":\"6H cleanup smoke\"}", 200);
        assertEquals("WAIVED", jdbc.queryForObject("SELECT status FROM fines WHERE id=?", String.class, fineId));

        assertEquals("PENDING", call("GET", "/api/payments/" + fixture.paymentId + "/status", member, null, 200).path("status").asText());
        assertEquals(1, call("GET", "/api/payments", admin, null, 200).path("content").size());
        assertEquals(403, request("GET", "/api/payments", member, null).statusCode());
    }

    private String login(String email) throws Exception {
        JsonNode response = call("POST", "/auth/login", null,
            mapper.writeValueAsString(java.util.Map.of("email", email, "password", PASSWORD)), 200);
        String jwt = response.path("jwt").asText();
        assertFalse(jwt.isBlank(), "Login must provide a JWT over the live HTTP port");
        return "Bearer " + jwt;
    }

    private JsonNode call(String method, String path, String bearer, String body, int expected) throws Exception {
        HttpResponse<String> response = request(method, path, bearer, body);
        assertEquals(expected, response.statusCode(),
            "Unexpected HTTP status for " + method + " " + path + ": " + response.body());
        return response.body() == null || response.body().isBlank() ? mapper.nullNode() : mapper.readTree(response.body());
    }

    private HttpResponse<String> request(String method, String path, String bearer, String body) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .header("Content-Type", "application/json");
        if (bearer != null) request.header("Authorization", bearer);
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private void cleanupBookRows(long bookId) {
        jdbc.update("DELETE FROM fines WHERE book_loan_id IN (SELECT id FROM book_loans WHERE book_id=?)", bookId);
        jdbc.update("DELETE FROM book_reviews WHERE book_id=?", bookId);
        jdbc.update("DELETE FROM wishlists WHERE book_id=?", bookId);
        jdbc.update("DELETE FROM reservations WHERE book_id=?", bookId);
        jdbc.update("DELETE FROM book_loans WHERE book_id=?", bookId);
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

    private static String marks(int count) { return String.join(",", java.util.Collections.nCopies(count, "?")); }

    private static String alphaToken() {
        String raw = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        StringBuilder result = new StringBuilder(raw.length());
        for (char c : raw.toCharArray()) result.append(Character.isDigit(c) ? (char) ('Q' + c - '0') : c);
        return result.toString();
    }

    private static final class Fixture {
        Long memberId, adminId, genreId, planId, subscriptionId, availableBookId, reservationBookId, paymentId;
        String memberEmail, adminEmail, planCode, apiPlanCode;
        final List<Long> userIds = new ArrayList<>();
    }
}
