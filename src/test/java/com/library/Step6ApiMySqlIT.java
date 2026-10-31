package com.library;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.domain.UserRole;
import com.library.modal.User;
import com.library.modal.*;
import com.library.domain.*;
import com.library.service.EmailService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.sql.SQLException;
import com.library.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Opt-in only: real MySQL + MVC/security, each test rolls back. Never call payment/mail APIs. */
@EnabledIfSystemProperty(named = "step6.mysql", matches = "true")
@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=validate", "spring.sql.init.mode=never",
    "app.initialize-admin=false", "payos.enabled=false", "payos.creation-enabled=false",
    "app.jwt.secret=test-only-jwt-secret-with-at-least-32-bytes", "app.jwt.expiration-ms=60000",
    "spring.jpa.show-sql=false", "spring.datasource.hikari.read-only=false",
    "spring.datasource.hikari.data-source-properties.sessionVariables=transaction_read_only=OFF"
})
@Transactional
class Step6ApiMySqlIT {
    @Autowired WebApplicationContext context;
    @Autowired @Qualifier("springSecurityFilterChain") Filter security;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService emailService;
    MockMvc mvc;
    final ObjectMapper json = new ObjectMapper();
    String admin, member;

    @BeforeEach void prepare() throws Exception {
        assertEquals("library_db1", jdbc.queryForObject("SELECT DATABASE()", String.class));
        for (String table : jdbc.queryForList("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'", String.class)) {
            assertTrue(table.matches("[a-z_]+"));
            assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM `" + table + "`", Long.class),
                "Safety stop: database is not empty; no fixtures will be written");
        }
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(security).build();
        admin = fixtureLogin("step6-admin@example.invalid", UserRole.ROLE_ADMIN);
        member = fixtureLogin("step6-member@example.invalid", UserRole.ROLE_USER);
    }

    String fixtureLogin(String email, UserRole role) throws Exception {
        users.saveAndFlush(User.builder().email(email).fullName("Step6 temporary fixture")
            .password(encoder.encode("Step6LocalTest123!")).role(role).build());
        JsonNode response = call(post("/auth/login").content("{\"email\":\"" + email + "\",\"password\":\"Step6LocalTest123!\"}"), null, 200);
        assertFalse(response.path("jwt").asText().isBlank(), "Login must return JWT");
        return "Bearer " + response.path("jwt").asText();
    }

    JsonNode call(MockHttpServletRequestBuilder request, String token, int expected) throws Exception {
        if (token != null) request.header("Authorization", token);
        var response = mvc.perform(request.contentType("application/json")).andReturn().getResponse();
        assertEquals(expected, response.getStatus(), "Unexpected HTTP status");
        String body = response.getContentAsString();
        return body.isBlank() ? json.nullNode() : json.readTree(body);
    }

    long genre() throws Exception {
        return call(post("/api/genres/create").content(genreBody("Step6 genre")), admin, 200).path("id").asLong();
    }
    String genreBody(String name) { return "{\"code\":\"STEP_SIX\",\"name\":\"" + name + "\",\"displayOrder\":0}"; }
    String bookBody(long genre) { return "{\"isbn\":\"STEP6-TEST-BOOK\",\"title\":\"Step6 book\",\"author\":\"Test author\",\"genreId\":" + genre + ",\"totalCopies\":2,\"availableCopies\":2,\"price\":10000}"; }
    long book(long genre) throws Exception { return call(post("/api/admin/book/admin").content(bookBody(genre)), admin, 200).path("id").asLong(); }
    String planBody() { return "{\"planCode\":\"STEP6_PLAN\",\"name\":\"Step6 plan\",\"durationDays\":30,\"price\":20000,\"currency\":\"VND\",\"maxBooksAllowed\":2,\"maxDaysPerBook\":7,\"displayOrder\":0,\"isActive\":true,\"isFeatured\":false}"; }

    @Test void loginAndAdminAuthorization() throws Exception {
        call(get("/api/payments"), admin, 200);
        call(get("/api/payments"), member, 403);
        call(post("/api/subscription-plans/admin/create").content(planBody()), member, 403);
        em.flush();
        assertEquals(2L, jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE last_login IS NOT NULL", Long.class));
    }
    @Test void signupNewEmailShouldSucceed() throws Exception {
        JsonNode response = call(post("/auth/signup").content("{\"email\":\"step6-new@example.invalid\",\"fullName\":\"Step6 new user\",\"password\":\"Step6LocalTest123!\",\"role\":\"ROLE_ADMIN\"}"), null, 200);
        em.flush(); em.clear();
        User saved = users.findByEmail("step6-new@example.invalid");
        assertEquals(UserRole.ROLE_USER, saved.getRole());
        assertTrue(encoder.matches("Step6LocalTest123!", saved.getPassword()));
        assertTrue(response.path("user").path("password").isNull());
        String jwt = response.path("jwt").asText();
        assertFalse(jwt.isBlank());
        JsonNode claims = json.readTree(java.util.Base64.getUrlDecoder().decode(jwt.split("\\.")[1]));
        assertEquals("ROLE_USER", claims.path("authorities").asText());
        call(get("/api/genres"), "Bearer " + jwt, 200);
        call(get("/api/payments"), "Bearer " + jwt, 403);
    }
    @Test void duplicateSignupReturnsControlledErrorWithoutChangingUser() throws Exception {
        User before = users.findByEmail("step6-member@example.invalid");
        String hash = before.getPassword();
        JsonNode response = call(post("/auth/signup").content("{\"email\":\"step6-member@example.invalid\",\"fullName\":\"Replacement\",\"password\":\"different-password\"}"), null, 400);
        assertFalse(response.path("status").asBoolean(true));
        assertFalse(response.toString().contains("different-password"));
        em.flush(); em.clear();
        assertEquals(hash, users.findByEmail("step6-member@example.invalid").getPassword());
        assertEquals(2L, users.count());
    }
    @Test void missingSignupFieldsReturn400() throws Exception {
        call(post("/auth/signup").content("{}"), null, 400);
        assertEquals(2L, users.count());
    }
    @Test void blankOrInvalidSignupFieldsReturn400() throws Exception {
        for (String body : new String[]{
            "{\"email\":\"not-an-email\",\"fullName\":\"Test user\",\"password\":\"abc123\"}",
            "{\"email\":\"valid@example.invalid\",\"fullName\":\"  \",\"password\":\"abc123\"}",
            "{\"email\":\"valid@example.invalid\",\"fullName\":\"Test user\",\"password\":\"  \"}"}) {
            call(post("/auth/signup").content(body), null, 400);
        }
        assertEquals(2L, users.count());
    }
    @Test void catalogWritesBlockedForMemberAndAnonymous() throws Exception {
        for (String token : new String[]{member, null}) {
            call(post("/api/admin/book/admin").content("{}"), token, 403);
            call(post("/api/books/bulk").content("[]"), token, 403);
            call(put("/api/books/999999").content("{}"), token, 403);
            call(delete("/api/books/999999"), token, 403);
            call(delete("/api/books/999999/permanent"), token, 403);
            call(post("/api/genres/create").content("{}"), token, 403);
            call(put("/api/genres/999999").content("{}"), token, 403);
            call(delete("/api/genres/999999"), token, 403);
            call(delete("/api/genres/999999/hard"), token, 403);
        }
    }
    @Test void memberCanSearchAndAdminCanBulkCreate() throws Exception {
        long genre = genre();
        call(post("/api/books/bulk").content("[" + bookBody(genre) + "]"), admin, 200);
        em.flush();
        assertEquals(1L, jdbc.queryForObject("SELECT COUNT(*) FROM books", Long.class));
        call(post("/api/books/search").content("{\"page\":0,\"size\":10,\"sortBy\":\"createdAt\",\"sortDirection\":\"DESC\",\"availableOnly\":false}"), member, 200);
        call(get("/api/genres"), member, 200);
    }
    @Test void advancedSearchDefaultsShouldNotCrash() throws Exception {
        call(post("/api/books/search").content("{}"), member, 200);
    }
    @Test void genreCrud() throws Exception {
        long id = genre();
        call(get("/api/genres/" + id), member, 200);
        call(put("/api/genres/" + id).content(genreBody("Step6 updated")), admin, 200);
        em.flush(); em.clear();
        assertEquals("Step6 updated", jdbc.queryForObject("SELECT name FROM genres WHERE id=?", String.class, id));
        call(delete("/api/genres/" + id), admin, 200);
        em.flush();
        assertEquals(0, jdbc.queryForObject("SELECT active FROM genres WHERE id=?", Integer.class, id));
        call(delete("/api/genres/" + id + "/hard"), admin, 200);
        em.flush();
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM genres WHERE id=?", Long.class, id));
    }
    @Test void bookCrudAndForeignKey() throws Exception {
        long genre = genre(), book = book(genre);
        call(get("/api/books").param("genreId", "" + genre), member, 200);
        call(put("/api/books/" + book).content(bookBody(genre).replace("Step6 book", "Updated book")), admin, 200);
        em.flush(); em.clear();
        assertEquals("Updated book", jdbc.queryForObject("SELECT title FROM books WHERE id=? AND genre_id=?", String.class, book, genre));
        call(delete("/api/books/" + book), admin, 200);
        em.flush();
        assertEquals(0, jdbc.queryForObject("SELECT active FROM books WHERE id=?", Integer.class, book));
        call(delete("/api/books/" + book + "/permanent"), admin, 200);
        em.flush();
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM books WHERE id=?", Long.class, book));
    }
    @Test void bookCountMatchesDatabase() throws Exception {
        long genre = genre(); book(genre);
        assertEquals(1L, call(get("/api/genres/" + genre + "/book-count"), admin, 200).asLong());
    }
    @Test void bookStatsCountActiveAndAvailableTitles() throws Exception {
        long genre = genre();
        long available = book(genre);
        String noCopies = bookBody(genre).replace("STEP6-TEST-BOOK", "STEP6-NO-COPIES").replace("\"availableCopies\":2", "\"availableCopies\":0");
        call(post("/api/admin/book/admin").content(noCopies), admin, 200);
        JsonNode stats = call(get("/api/books/stats"), member, 200);
        assertEquals(2, stats.path("totalActiveBooks").asInt());
        assertEquals(1, stats.path("totalAvailableBooks").asInt());
        call(delete("/api/books/" + available), admin, 200);
        stats = call(get("/api/books/stats"), member, 200);
        assertEquals(1, stats.path("totalActiveBooks").asInt());
        assertEquals(0, stats.path("totalAvailableBooks").asInt());
    }
    @Test void bookCountUsesDirectGenreIncludingSoftDeletedTitles() throws Exception {
        long parent = genre();
        assertEquals(0L, call(get("/api/genres/" + parent + "/book-count"), member, 200).asLong());
        long first = book(parent);
        call(post("/api/admin/book/admin").content(bookBody(parent).replace("STEP6-TEST-BOOK", "STEP6-SECOND-BOOK")), admin, 200);
        call(delete("/api/books/" + first), admin, 200);
        long child = call(post("/api/genres/create").content(
                "{\"code\":\"STEP_CHILD\",\"name\":\"Child genre\",\"displayOrder\":0,\"parentGenreId\":" + parent + "}"), admin, 200).path("id").asLong();
        call(post("/api/admin/book/admin").content(bookBody(child).replace("STEP6-TEST-BOOK", "STEP6-CHILD-BOOK")), admin, 200);
        em.flush(); em.clear();
        assertEquals(2L, jdbc.queryForObject("SELECT COUNT(*) FROM books WHERE genre_id=?", Long.class, parent));
        assertEquals(2L, call(get("/api/genres/" + parent + "/book-count"), member, 200).asLong());
        assertEquals(1L, call(get("/api/genres/" + child + "/book-count"), member, 200).asLong());
        call(delete("/api/books/" + first + "/permanent"), admin, 200);
        em.flush(); em.clear();
        assertEquals(1L, call(get("/api/genres/" + parent + "/book-count"), member, 200).asLong());
    }
    @Test void memberMustNotDeleteCatalogBook() throws Exception {
        long id = book(genre());
        call(delete("/api/books/" + id + "/permanent"), member, 403);
    }
    @Test void invalidBookRejectedBeforeInsert() throws Exception {
        call(post("/api/admin/book/admin").content("{}"), admin, 400);
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM books", Long.class));
    }
    @Test void wishlistCreateReadDelete() throws Exception {
        long id = book(genre());
        call(post("/api/wishlist/add/" + id).param("notes", "Step6 test"), member, 200);
        em.flush();
        assertEquals(1L, jdbc.queryForObject("SELECT COUNT(*) FROM wishlists WHERE book_id=?", Long.class, id));
        call(get("/api/wishlist/my-wishlist"), member, 200);
        call(delete("/api/wishlist/remove/" + id), member, 200);
        em.flush();
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM wishlists", Long.class));
    }
    @Test void planCreateReadDelete() throws Exception {
        long id = call(post("/api/subscription-plans/admin/create").content(planBody()), admin, 200).path("id").asLong();
        call(get("/api/subscription-plans"), member, 200);
        em.flush();
        assertEquals("VND", jdbc.queryForObject("SELECT currency FROM subscription_plans WHERE id=?", String.class, id));
        call(delete("/api/subscription-plans/admin/" + id), admin, 200);
        em.flush();
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM subscription_plans", Long.class));
    }
    @Test void planUpdateReturnsUpdatedDto() throws Exception {
        long id = call(post("/api/subscription-plans/admin/create").content(planBody()), admin, 200).path("id").asLong();
        JsonNode response = call(put("/api/subscription-plans/admin/" + id).content(planBody().replace("Step6 plan", "Updated plan")), admin, 200);
        em.flush();
        assertEquals("Updated plan", jdbc.queryForObject("SELECT title FROM subscription_plans WHERE id=?", String.class, id));
        assertEquals(id, response.path("id").asLong(), "Update must return the updated DTO");
        assertEquals("Updated plan", response.path("name").asText());
        assertEquals("STEP6_PLAN", response.path("planCode").asText());
        assertEquals("VND", response.path("currency").asText());
        assertEquals(20000L, response.path("price").asLong());
        assertEquals(2, response.path("maxBooksAllowed").asInt());
        assertEquals("Step6 temporary fixture", response.path("updatedBy").asText());
    }

    User memberUser() { return users.findByEmail("step6-member@example.invalid"); }
    Subscription membership(User user) throws Exception {
        Long planId = jdbc.queryForObject("SELECT MIN(id) FROM subscription_plans", Long.class);
        if (planId == null) planId = call(post("/api/subscription-plans/admin/create").content(planBody()), admin, 200).path("id").asLong();
        Subscription s = new Subscription(); s.setUser(user); s.setPlan(em.find(SubscriptionPlan.class, planId));
        s.initializeFromPlan(); s.setIsActive(true); em.persist(s); em.flush(); return s;
    }
    long checkout(long book, String token) throws Exception {
        return call(post("/api/book-loans/checkout").content("{\"bookId\":"+book+",\"checkoutDays\":7}"), token, 201).path("id").asLong();
    }
    BookLoan loanFixture(long book, BookLoanStatus status) {
        BookLoan l = BookLoan.builder().user(memberUser()).book(em.find(Book.class, book)).type(BookLoanType.CHECKOUT)
            .status(status).checkoutDate(LocalDate.now().minusDays(3)).dueDate(LocalDate.now().plusDays(4)).build();
        if (status == BookLoanStatus.RETURNED) l.setReturnDate(LocalDate.now());
        else l.getBook().setAvailableCopies(1);
        em.persist(l); em.flush(); return l;
    }
    long reservation(long book) throws Exception {
        em.find(Book.class, book).setAvailableCopies(0); em.flush();
        return call(post("/api/reservations").content("{\"bookId\":"+book+",\"notes\":\"Step6 reservation\"}"), member, 200).path("id").asLong();
    }
    long review(long book) throws Exception {
        loanFixture(book, BookLoanStatus.RETURNED);
        return call(post("/api/reviews").content(reviewBody(book)), member, 201).path("id").asLong();
    }
    String reviewBody(long book) { return "{\"bookId\":"+book+",\"rating\":4,\"reviewText\":\"Step6 useful review text\",\"title\":\"Step6 review\"}"; }
    long fine(long loan) throws Exception {
        return call(post("/api/fines").content("{\"bookLoanId\":"+loan+",\"type\":\"OVERDUE\",\"amount\":10000,\"reason\":\"Step6 fine\"}"), admin, 200).path("id").asLong();
    }
    Payment paymentFixture() {
        Payment p = Payment.builder().user(memberUser()).paymentType(PaymentType.MEMBERSHIP)
            .gateway(PaymentGateway.PAYOS).status(PaymentStatus.PENDING).amount(20000L).build();
        em.persist(p); em.flush(); return p;
    }
    void clientError(MockHttpServletRequestBuilder req, String token) throws Exception {
        if (token != null) req.header("Authorization", token);
        int status = mvc.perform(req.contentType("application/json")).andReturn().getResponse().getStatus();
        assertTrue(status >= 400 && status < 500, "Expected controlled 4xx, actual="+status);
    }
    @Test void loanCheckoutRenewReturnAndQueries() throws Exception {
        membership(memberUser()); long book = book(genre()), id = checkout(book, member);
        em.flush(); assertEquals(1, jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?", Integer.class, book));
        assertEquals(1L, call(get("/api/book-loans/my"), member, 200).path("totalElements").asLong());
        call(get("/api/book-loans/my").param("status","CHECKED_OUT"), member, 200);
        call(post("/api/book-loans/search").content("{\"page\":0,\"size\":10,\"sortBy\":\"createdAt\",\"sortDirection\":\"DESC\"}"), admin, 200);
        call(post("/api/book-loans/renew").content("{\"bookLoanId\":"+id+",\"extensionDays\":2}"), member, 200);
        em.flush(); assertEquals(1, jdbc.queryForObject("SELECT renewal_count FROM book_loans WHERE id=?", Integer.class, id));
        call(post("/api/book-loans/checkin").content("{\"bookLoanId\":"+id+",\"condition\":\"RETURNED\"}"), member, 200);
        em.flush(); assertEquals("RETURNED", jdbc.queryForObject("SELECT status FROM book_loans WHERE id=?", String.class, id));
        assertEquals(2, jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?", Integer.class, book));
    }
    @Test void checkoutNoMembershipControlledError() throws Exception {
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+book(genre())+",\"checkoutDays\":7}"), member);
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM book_loans",Long.class));
    }
    @Test void duplicateCheckoutControlledError() throws Exception {
        membership(memberUser()); long b=book(genre()); checkout(b,member);
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+b+",\"checkoutDays\":7}"),member);
    }
    @Test void checkoutRespectsMembershipDayLimit() throws Exception {
        membership(memberUser()); long b=book(genre());
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+b+",\"checkoutDays\":60}"),member);
    }
    @Test void checkoutRespectsMembershipBookLimit() throws Exception {
        Subscription s=membership(memberUser()); s.setMaxBooksAllowed(1); long g=genre(), b=book(g); checkout(b,member);
        long b2=call(post("/api/admin/book/admin").content(bookBody(g).replace("STEP6-TEST-BOOK","STEP6-LIMIT")),admin,200).path("id").asLong();
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+b2+",\"checkoutDays\":7}"),member);
    }
    @Test void crossUserCheckinForbidden() throws Exception {
        long l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId(); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER);
        call(post("/api/book-loans/checkin").content("{\"bookLoanId\":"+l+",\"condition\":\"RETURNED\"}"),other,403);
    }
    @Test void crossUserRenewForbidden() throws Exception {
        long l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId(); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER);
        call(post("/api/book-loans/renew").content("{\"bookLoanId\":"+l+",\"extensionDays\":1}"),other,403);
    }
    @Test void adminCheckoutUsesTargetMembership() throws Exception {
        membership(memberUser()); long b=book(genre());
        call(post("/api/book-loans/checkout/user/"+memberUser().getId()).content("{\"bookId\":"+b+",\"checkoutDays\":7}"),admin,201);
    }
    @Test void memberCannotCheckoutForAnotherUser() throws Exception {
        membership(memberUser()); User target=users.findByEmail("step6-admin@example.invalid"); long b=book(genre());
        call(post("/api/book-loans/checkout/user/"+target.getId()).content("{\"bookId\":"+b+",\"checkoutDays\":7}"),member,403);
    }
    @Test void memberCannotSearchAllLoans() throws Exception {
        call(post("/api/book-loans/search").content("{\"page\":0,\"size\":10,\"sortBy\":\"createdAt\",\"sortDirection\":\"DESC\"}"),member,403);
    }
    @Test void memberCannotRunOverdueAdminJob() throws Exception { call(post("/api/book-loans/admin/update-overdue"),member,403); }
    @Test void overdueAdminJobStoresDayCount() throws Exception {
        BookLoan l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT); l.setDueDate(LocalDate.now().minusDays(2)); em.flush();
        call(post("/api/book-loans/admin/update-overdue"),admin,200); em.flush();
        assertEquals("OVERDUE",jdbc.queryForObject("SELECT status FROM book_loans WHERE id=?",String.class,l.getId()));
        assertEquals(2,jdbc.queryForObject("SELECT overdue_days FROM book_loans WHERE id=?",Integer.class,l.getId()));
    }
    @Test void checkinCannotLeaveLoanCheckedOut() throws Exception {
        long l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId();
        clientError(post("/api/book-loans/checkin").content("{\"bookLoanId\":"+l+",\"condition\":\"CHECKED_OUT\"}"),member);
    }
    @Test void loanExpiredMembershipReturnsControlledError() throws Exception {
        Subscription s=membership(memberUser()); s.setStartDate(LocalDate.now().minusDays(10)); s.setEndDate(LocalDate.now().minusDays(1)); em.flush();
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+book(genre())+",\"checkoutDays\":7}"),member);
    }
    @Test void loanUnavailableBookReturnsControlledError() throws Exception {
        membership(memberUser()); long b=book(genre()); em.find(Book.class,b).setAvailableCopies(0); em.flush();
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+b+",\"checkoutDays\":7}"),member);
    }
    @Test void loanInactiveBookReturnsControlledError() throws Exception {
        membership(memberUser()); long b=book(genre()); em.find(Book.class,b).setActive(false); em.flush();
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+b+",\"checkoutDays\":7}"),member);
    }
    @Test void loanCheckoutMissingDaysUsesDefaultOrReturns4xx() throws Exception {
        membership(memberUser()); long b=book(genre());
        int status=mvc.perform(post("/api/book-loans/checkout").header("Authorization",member).contentType("application/json")
            .content("{\"bookId\":"+b+"}")).andReturn().getResponse().getStatus();
        assertTrue(status==201 || (status>=400 && status<500));
    }
    @Test void loanRenewMissingDaysUsesDefaultOrReturns4xx() throws Exception {
        long l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId();
        int status=mvc.perform(post("/api/book-loans/renew").header("Authorization",member).contentType("application/json")
            .content("{\"bookLoanId\":"+l+"}")).andReturn().getResponse().getStatus();
        assertTrue(status==200 || (status>=400 && status<500));
    }
    @Test void loanInvalidDaysAndIdsRejectedByValidation() throws Exception {
        call(post("/api/book-loans/checkout").content("{\"bookId\":1,\"checkoutDays\":0}"),member,400);
        call(post("/api/book-loans/renew").content("{\"bookLoanId\":1,\"extensionDays\":0}"),member,400);
        call(post("/api/book-loans/checkin").content("{}"),member,400);
        call(post("/api/book-loans/checkin").content("{\"bookLoanId\":1,\"condition\":\"INVALID\"}"),member,400);
    }
    @Test void loanRepeatedReturnRejectedWithoutInventoryIncrease() throws Exception {
        long b=book(genre()), l=loanFixture(b,BookLoanStatus.RETURNED).getId();
        clientError(post("/api/book-loans/checkin").content("{\"bookLoanId\":"+l+"}"),member);
        em.flush(); assertEquals(2,jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?",Integer.class,b));
    }
    @Test void loanLostReturnDoesNotIncreaseInventory() throws Exception {
        long b=book(genre()), l=loanFixture(b,BookLoanStatus.CHECKED_OUT).getId();
        call(post("/api/book-loans/checkin").content("{\"bookLoanId\":"+l+",\"condition\":\"LOST\"}"),member,200);
        em.flush(); assertEquals(1,jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?",Integer.class,b));
        assertEquals("LOST",jdbc.queryForObject("SELECT status FROM book_loans WHERE id=?",String.class,l));
    }
    @Test void loanRenewAtLimitReturnsControlledError() throws Exception {
        BookLoan l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT); l.setRenewalCount(2); em.flush();
        clientError(post("/api/book-loans/renew").content("{\"bookLoanId\":"+l.getId()+",\"extensionDays\":1}"),member);
    }
    @Test void loanRenewPastDueBeforeOverdueJobRejected() throws Exception {
        BookLoan l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT); l.setDueDate(LocalDate.now().minusDays(1)); em.flush();
        clientError(post("/api/book-loans/renew").content("{\"bookLoanId\":"+l.getId()+",\"extensionDays\":2}"),member);
    }
    @Test void loanCheckoutPastDueBeforeOverdueJobRejected() throws Exception {
        membership(memberUser()); long g=genre(); BookLoan l=loanFixture(book(g),BookLoanStatus.CHECKED_OUT);
        l.setDueDate(LocalDate.now().minusDays(1)); em.flush();
        long b=call(post("/api/admin/book/admin").content(bookBody(g).replace("STEP6-TEST-BOOK","STEP6-NEXT")),admin,200).path("id").asLong();
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":"+b+",\"checkoutDays\":7}"),member);
    }
    @Test void loanMyQueryDoesNotLeakOtherUsers() throws Exception {
        loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT);
        String other=fixtureLogin("loan-other@example.invalid",UserRole.ROLE_USER);
        assertEquals(0,call(get("/api/book-loans/my"),other,200).path("totalElements").asInt());
        assertEquals(1,call(get("/api/book-loans/my").param("status","CHECKED_OUT"),member,200).path("totalElements").asInt());
    }
    @Test void loanAdminCanRenewAndReturnDamaged() throws Exception {
        long b=book(genre()), l=loanFixture(b,BookLoanStatus.CHECKED_OUT).getId();
        call(post("/api/book-loans/renew").content("{\"bookLoanId\":"+l+",\"extensionDays\":2}"),admin,200);
        call(post("/api/book-loans/checkin").content("{\"bookLoanId\":"+l+",\"condition\":\"DAMAGED\"}"),admin,200);
        em.flush();
        assertEquals("DAMAGED",jdbc.queryForObject("SELECT status FROM book_loans WHERE id=?",String.class,l));
        assertEquals(2,jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?",Integer.class,b));
    }
    @Test void loanTerminalStatesCannotRenew() throws Exception {
        long b=book(genre()); BookLoan loan=loanFixture(b,BookLoanStatus.RETURNED);
        for(BookLoanStatus state : new BookLoanStatus[]{BookLoanStatus.RETURNED,BookLoanStatus.LOST,BookLoanStatus.DAMAGED,BookLoanStatus.OVERDUE}) {
            loan.setStatus(state); em.flush();
            clientError(post("/api/book-loans/renew").content("{\"bookLoanId\":"+loan.getId()+",\"extensionDays\":1}"),member);
        }
    }
    @Test void loanNullDaysAndLongNotesReturn400() throws Exception {
        call(post("/api/book-loans/checkout").content("{\"bookId\":1,\"checkoutDays\":null}"),member,400);
        call(post("/api/book-loans/renew").content("{\"bookLoanId\":1,\"extensionDays\":null}"),member,400);
        call(post("/api/book-loans/checkout").content("{\"bookId\":1,\"checkoutDays\":7,\"notes\":\""+"x".repeat(501)+"\"}"),member,400);
    }
    @Test void loanMissingIdsReturnControlledError() throws Exception {
        clientError(post("/api/book-loans/checkin").content("{\"bookLoanId\":-1}"),member);
        clientError(post("/api/book-loans/renew").content("{\"bookLoanId\":-1,\"extensionDays\":1}"),member);
        membership(memberUser());
        clientError(post("/api/book-loans/checkout").content("{\"bookId\":-1,\"checkoutDays\":7}"),member);
    }
    @Test void loanOverdueJobRefreshesExistingOverdueCount() throws Exception {
        BookLoan l=loanFixture(book(genre()),BookLoanStatus.OVERDUE); l.setDueDate(LocalDate.now().minusDays(2)); l.setOverdueDays(1); em.flush();
        call(post("/api/book-loans/admin/update-overdue"),admin,200); em.flush();
        assertEquals(2,jdbc.queryForObject("SELECT overdue_days FROM book_loans WHERE id=?",Integer.class,l.getId()));
    }
    @Test void loanSearchDefaultsAndNegativePagination() throws Exception {
        call(post("/api/book-loans/search").content("{}"),admin,200);
        clientError(get("/api/book-loans/my").param("page","-1"),member);
        call(post("/api/book-loans/search").content("{\"page\":null}"),admin,400);
    }
    @Test void loanExtremeRenewalReturns400BeforeWriting() throws Exception {
        BookLoan l=loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT);
        LocalDate oldDue=l.getDueDate();
        clientError(post("/api/book-loans/renew").content("{\"bookLoanId\":"+l.getId()+",\"extensionDays\":2147483647}"),member);
        em.flush();
        assertEquals(oldDue,jdbc.queryForObject("SELECT due_date FROM book_loans WHERE id=?",java.sql.Date.class,l.getId()).toLocalDate());
    }
    @Test void loanMembershipTargetIsPrivate() throws Exception {
        membership(memberUser());
        assertEquals(memberUser().getId().longValue(),call(get("/api/subscriptions/user/active").param("userId",""+memberUser().getId()),admin,200).path("userId").asLong());
        String other=fixtureLogin("private@example.invalid",UserRole.ROLE_USER);
        call(get("/api/subscriptions/user/active").param("userId",""+memberUser().getId()),other,403);
    }
    @Test void reservationCreateListCancel() throws Exception {
        long r=reservation(book(genre()));
        assertEquals(1L,call(get("/api/reservations/my"),member,200).path("totalElements").asLong());
        call(delete("/api/reservations/"+r),member,200); em.flush();
        assertEquals("CANCELLED",jdbc.queryForObject("SELECT status FROM reservations WHERE id=?",String.class,r));
    }
    @Test void duplicateReservationControlledError() throws Exception {
        long b=book(genre()); reservation(b); clientError(post("/api/reservations").content("{\"bookId\":"+b+"}"),member);
    }
    @Test void crossUserReservationCancelForbidden() throws Exception {
        long r=reservation(book(genre())); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER);
        call(delete("/api/reservations/"+r),other,403);
    }
    @Test void adminReservationForUserStoresTargetUser() throws Exception {
        long b=book(genre()); em.find(Book.class,b).setAvailableCopies(0); em.flush(); long target=memberUser().getId();
        long r=call(post("/api/reservations/user/"+target).content("{\"bookId\":"+b+"}"),admin,201).path("id").asLong(); em.flush();
        assertEquals(target,jdbc.queryForObject("SELECT user_id FROM reservations WHERE id=?",Long.class,r));
    }
    @Test void memberCannotReserveForAnotherUser() throws Exception {
        long b=book(genre()); em.find(Book.class,b).setAvailableCopies(0); em.flush();
        call(post("/api/reservations/user/"+users.findByEmail("step6-admin@example.invalid").getId()).content("{\"bookId\":"+b+"}"),member,403);
    }
    @Test void adminReservationFulfillCreatesLoanAndOwnerCannotSelfConfirm() throws Exception {
        membership(memberUser()); long b=book(genre()), r=reservation(b); em.find(Book.class,b).setAvailableCopies(1); em.flush();
        call(post("/api/reservations/"+r+"/fulfill"),member,403);
        call(post("/api/reservations/"+r+"/fulfill"),admin,200); em.flush();
        assertEquals("FULFILLED",jdbc.queryForObject("SELECT status FROM reservations WHERE id=?",String.class,r));
        assertEquals(1L,jdbc.queryForObject("SELECT COUNT(*) FROM book_loans WHERE book_id=?",Long.class,b));
        assertEquals(7,jdbc.queryForObject("SELECT DATEDIFF(due_date, checkout_date) FROM book_loans WHERE book_id=?",Integer.class,b));
    }
    @Test void cancelledReservationCannotBeFulfilled() throws Exception {
        membership(memberUser()).setMaxDaysPerBook(30); long b=book(genre()), r=reservation(b); call(delete("/api/reservations/"+r),member,200);
        em.find(Book.class,b).setAvailableCopies(1); em.flush(); clientError(post("/api/reservations/"+r+"/fulfill"),admin);
    }
    @Test void reservationAdminFulfillWithinMembershipLimit() throws Exception {
        membership(memberUser()).setMaxDaysPerBook(30); long b=book(genre()), r=reservation(b);
        em.find(Book.class,b).setAvailableCopies(1); em.flush();
        call(post("/api/reservations/"+r+"/fulfill"),admin,200); em.flush();
        assertEquals(0,jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?",Integer.class,b));
        assertEquals(1L,jdbc.queryForObject("SELECT COUNT(*) FROM book_loans WHERE book_id=?",Long.class,b));
        assertEquals("FULFILLED",jdbc.queryForObject("SELECT status FROM reservations WHERE id=?",String.class,r));
        assertEquals(14,jdbc.queryForObject("SELECT DATEDIFF(due_date, checkout_date) FROM book_loans WHERE book_id=?",Integer.class,b));
    }
    @Test void reservationMyListIsIsolated() throws Exception {
        reservation(book(genre())); String other=fixtureLogin("reservation-other@example.invalid",UserRole.ROLE_USER);
        assertEquals(0,call(get("/api/reservations/my"),other,200).path("totalElements").asInt());
        assertEquals(1,call(get("/api/reservations/my").param("status","PENDING"),member,200).path("totalElements").asInt());
    }
    @Test void reservationMissingBookIdRejected() throws Exception {
        call(post("/api/reservations").content("{}"),member,400);
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM reservations",Long.class));
    }
    @Test void reservationAvailableBookRejectedWith4xx() throws Exception {
        clientError(post("/api/reservations").content("{\"bookId\":"+book(genre())+"}"),member);
    }
    @Test void reservationInactiveBookRejected() throws Exception {
        long b=book(genre()); Book book=em.find(Book.class,b); book.setActive(false); book.setAvailableCopies(0); em.flush();
        clientError(post("/api/reservations").content("{\"bookId\":"+b+"}"),member);
    }
    @Test void reservationExpiredPickupRejected() throws Exception {
        membership(memberUser()).setMaxDaysPerBook(30); long b=book(genre()), r=reservation(b);
        Reservation entity=em.find(Reservation.class,r); entity.setStatus(ReservationStatus.AVAILABLE);
        entity.setAvailableAt(LocalDateTime.now().minusDays(2)); entity.setAvailableUntil(LocalDateTime.now().minusDays(1));
        em.find(Book.class,b).setAvailableCopies(1); em.flush();
        clientError(post("/api/reservations/"+r+"/fulfill"),admin);
    }
    @Test void reservationCrossUserFulfillDoesNotMutateStatus() throws Exception {
        membership(memberUser()).setMaxDaysPerBook(30); long b=book(genre()), r=reservation(b);
        em.find(Book.class,b).setAvailableCopies(1); em.flush();
        String other=fixtureLogin("reservation-other@example.invalid",UserRole.ROLE_USER);
        call(post("/api/reservations/"+r+"/fulfill"),other,403); em.flush();
        assertEquals("PENDING",jdbc.queryForObject("SELECT status FROM reservations WHERE id=?",String.class,r));
    }
    @Test void reservationAdminCanCancel() throws Exception {
        long r=reservation(book(genre())); call(delete("/api/reservations/"+r),admin,200); em.flush();
        assertEquals("CANCELLED",jdbc.queryForObject("SELECT status FROM reservations WHERE id=?",String.class,r));
    }
    @Test void reservationQueueRemainsOrderedAfterCancel() throws Exception {
        long b=book(genre()), first=reservation(b);
        String second=fixtureLogin("reservation-second@example.invalid",UserRole.ROLE_USER);
        long secondId=call(post("/api/reservations").content("{\"bookId\":"+b+"}"),second,200).path("id").asLong();
        call(delete("/api/reservations/"+first),member,200);
        String third=fixtureLogin("reservation-third@example.invalid",UserRole.ROLE_USER);
        long thirdId=call(post("/api/reservations").content("{\"bookId\":"+b+"}"),third,200).path("id").asLong(); em.flush();
        int secondPosition=jdbc.queryForObject("SELECT queue_position FROM reservations WHERE id=?",Integer.class,secondId);
        int thirdPosition=jdbc.queryForObject("SELECT queue_position FROM reservations WHERE id=?",Integer.class,thirdId);
        assertTrue(secondPosition < thirdPosition,"Existing reservation must precede later arrival; duplicate queue positions are invalid");
    }
    @Test void reservationRepeatedFulfillDoesNotCreateSecondLoan() throws Exception {
        membership(memberUser()).setMaxDaysPerBook(30);
        long b=book(genre()), r=reservation(b); em.find(Book.class,b).setAvailableCopies(1); em.flush();
        call(post("/api/reservations/"+r+"/fulfill"),admin,200);
        clientError(post("/api/reservations/"+r+"/fulfill"),admin); em.flush();
        assertEquals(1L,jdbc.queryForObject("SELECT COUNT(*) FROM book_loans WHERE book_id=?",Long.class,b));
        assertEquals(0,jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?",Integer.class,b));
    }
    @Test void reservationCheckoutFailurePreservesPendingState() throws Exception {
        long b=book(genre()), r=reservation(b); em.find(Book.class,b).setAvailableCopies(1); em.flush();
        clientError(post("/api/reservations/"+r+"/fulfill"),admin); em.flush();
        assertEquals("PENDING",jdbc.queryForObject("SELECT status FROM reservations WHERE id=?",String.class,r));
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM book_loans WHERE book_id=?",Long.class,b));
        assertEquals(1,jdbc.queryForObject("SELECT available_copies FROM books WHERE id=?",Integer.class,b));
    }
    @Test void reservationMissingResourceReturnsControlledError() throws Exception {
        call(delete("/api/reservations/999999999"),member,400);
        call(post("/api/reservations/999999999/fulfill"),admin,400);
        call(post("/api/reservations").content("{\"bookId\":999999999}"),member,400);
    }
    @Test void reviewCreateReadUpdateDelete() throws Exception {
        long b=book(genre()), r=review(b); call(get("/api/reviews/book/"+b),member,200);
        call(put("/api/reviews/"+r).content(reviewBody(b).replace("\"rating\":4","\"rating\":5")),member,200); em.flush();
        assertEquals(5,jdbc.queryForObject("SELECT rating FROM book_reviews WHERE id=?",Integer.class,r));
        call(delete("/api/reviews/"+r),member,200); em.flush();
        assertEquals(1L,jdbc.queryForObject("SELECT COUNT(*) FROM book_reviews WHERE id=?",Long.class,r));
        assertEquals(0,jdbc.queryForObject("SELECT is_active FROM book_reviews WHERE id=?",Integer.class,r));
        assertEquals(0,call(get("/api/reviews/book/"+b),member,200).path("totalElements").asInt());
        clientError(put("/api/reviews/"+r).content(reviewBody(b)),member);
        clientError(post("/api/reviews").content(reviewBody(b)),member);
    }
    @Test void reviewRequiresCompletedLoanControlledError() throws Exception { clientError(post("/api/reviews").content(reviewBody(book(genre()))),member); }
    @Test void duplicateReviewControlledError() throws Exception { long b=book(genre()); review(b); clientError(post("/api/reviews").content(reviewBody(b)),member); }
    @Test void crossUserReviewUpdateForbidden() throws Exception {
        long b=book(genre()), r=review(b); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER);
        call(put("/api/reviews/"+r).content(reviewBody(b)),other,403);
    }
    @Test void crossUserReviewDeleteForbidden() throws Exception {
        long r=review(book(genre())); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER); call(delete("/api/reviews/"+r),other,403);
    }
    @Test void reviewInvalidRating400() throws Exception { call(post("/api/reviews").content(reviewBody(book(genre())).replace("\"rating\":4","\"rating\":6")),member,400); }
    @Test void resetPasswordValidTokenAndNewLogin() throws Exception {
        PasswordResetToken t=PasswordResetToken.builder().token("step6-reset").user(memberUser()).expiryDate(LocalDateTime.now().plusMinutes(5)).build(); em.persist(t); em.flush();
        call(post("/auth/reset-password").content("{\"token\":\"step6-reset\",\"password\":\"NewLocalPass123!\"}"),null,200); em.flush(); em.clear();
        assertTrue(encoder.matches("NewLocalPass123!",memberUser().getPassword()));
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM password_reset_tokens",Long.class));
        clientError(post("/auth/reset-password").content("{\"token\":\"step6-reset\",\"password\":\"AnotherPass123!\"}"),null);
        clientError(post("/auth/login").content("{\"email\":\"step6-member@example.invalid\",\"password\":\"Step6LocalTest123!\"}"),null);
        call(post("/auth/login").content("{\"email\":\"step6-member@example.invalid\",\"password\":\"NewLocalPass123!\"}"),null,200);
    }
    @Test void expiredResetTokenControlledError() throws Exception {
        em.persist(PasswordResetToken.builder().token("step6-expired").user(memberUser()).expiryDate(LocalDateTime.now().minusMinutes(1)).build()); em.flush();
        clientError(post("/auth/reset-password").content("{\"token\":\"step6-expired\",\"password\":\"NewLocalPass123!\"}"),null);
    }
    @Test void invalidResetTokenControlledError() throws Exception { clientError(post("/auth/reset-password").content("{\"token\":\"unknown\",\"password\":\"NewLocalPass123!\"}"),null); }
    @Test void resetCannotUseBlankPassword() throws Exception {
        em.persist(PasswordResetToken.builder().token("step6-blank").user(memberUser()).expiryDate(LocalDateTime.now().plusMinutes(5)).build()); em.flush();
        clientError(post("/auth/reset-password").content("{\"token\":\"step6-blank\",\"password\":\"\"}"),null);
    }
    @Test void resetMissingFieldsReturns400() throws Exception {
        call(post("/auth/reset-password").content("{}"),null,400);
        call(post("/auth/reset-password").content("{\"token\":\"step6-missing-password\"}"),null,400);
    }
    @Test void forgotPasswordDoesNotRevealUnknownEmail() throws Exception {
        call(post("/auth/forgot-password").content("{\"email\":\"unknown@example.invalid\"}"),null,200);
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM password_reset_tokens",Long.class));
        org.mockito.Mockito.verifyNoInteractions(emailService);
    }
    @Test void forgotPasswordRejectsMalformedEmail() throws Exception {
        call(post("/auth/forgot-password").content("{\"email\":\"not-an-email\"}"),null,400);
        call(post("/auth/forgot-password").content("{}"),null,400);
    }
    @Test void forgotPasswordCreatesTokenWithUsableLinkWithoutRealEmail() throws Exception {
        call(post("/auth/forgot-password").content("{\"email\":\"step6-member@example.invalid\"}"),null,200); em.flush();
        assertEquals(1L,jdbc.queryForObject("SELECT COUNT(*) FROM password_reset_tokens",Long.class));
        var body=org.mockito.ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(emailService).sendEmail(org.mockito.ArgumentMatchers.eq("step6-member@example.invalid"),org.mockito.ArgumentMatchers.anyString(),body.capture());
        assertTrue(body.getValue().contains("http://localhost:5173/reset-password?token="),"Reset URL must contain the route and token query parameter");
    }
    @Test void profileDoesNotExposePasswordHash() throws Exception { assertTrue(call(get("/api/users/profile"),member,200).path("password").isMissingNode(),"Profile must not serialize stored password hash"); }
    @Test void memberCannotListAllUsers() throws Exception {
        call(get("/api/users/list"),member,403);
        call(get("/api/users/list"),null,403);
        assertEquals(2,call(get("/api/users/list"),admin,200).size());
    }
    @Test void adminUserListDoesNotExposePasswords() throws Exception {
        JsonNode list=call(get("/api/users/list"),admin,200); assertEquals(2,list.size()); for(JsonNode u:list) assertTrue(u.path("password").isNull());
    }
    @Test void subscriptionReadCancelAndAdminList() throws Exception {
        Subscription s=membership(memberUser()); call(get("/api/subscriptions/user/active"),member,200); call(get("/api/subscriptions/admin"),admin,200);
        call(post("/api/subscriptions/cancel/"+s.getId()).param("reason","Step6 cancel"),member,200); em.flush();
        assertEquals(0,jdbc.queryForObject("SELECT is_active FROM subscriptions WHERE id=?",Integer.class,s.getId()));
    }
    @Test void crossUserSubscriptionCancelForbidden() throws Exception {
        Subscription s=membership(memberUser()); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER);
        call(post("/api/subscriptions/cancel/"+s.getId()),other,403);
    }
    @Test void adminCanReadTargetActiveSubscription() throws Exception {
        Subscription s=membership(memberUser()); assertEquals(s.getId().longValue(),call(get("/api/subscriptions/user/active").param("userId",""+memberUser().getId()),admin,200).path("id").asLong());
    }
    @Test void expiredSubscriptionAdminJob() throws Exception {
        Subscription s=membership(memberUser()); s.setStartDate(LocalDate.now().minusDays(10)); s.setEndDate(LocalDate.now().minusDays(1)); em.flush();
        call(get("/api/subscriptions/admin/deactivate-expired"),admin,200); em.flush(); assertEquals(0,jdbc.queryForObject("SELECT is_active FROM subscriptions WHERE id=?",Integer.class,s.getId()));
    }
    @Test void disabledSubscribeControlledUnavailableWithoutDraft() throws Exception {
        long p=call(post("/api/subscription-plans/admin/create").content(planBody()),admin,200).path("id").asLong();
        call(post("/api/subscriptions/subscribe").content("{\"planId\":"+p+"}"),member,503);
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM subscriptions",Long.class));
    }
    @Test void fineCreateReadWaive() throws Exception {
        long f=fine(loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId());
        assertEquals(1,call(get("/api/fines/my"),member,200).size()); call(get("/api/fines").param("type","OVERDUE"),admin,200);
        call(post("/api/fines/waive").content("{\"fineId\":"+f+",\"reason\":\"Step6 approved waiver\"}"),admin,200); em.flush();
        assertEquals("WAIVED",jdbc.queryForObject("SELECT status FROM fines WHERE id=?",String.class,f));
    }
    @Test void fineCreateAndWaiveInvalidReferencesReturnClientErrors() throws Exception {
        call(post("/api/fines").content("{\"bookLoanId\":-1,\"type\":\"OVERDUE\",\"amount\":1000}"),admin,400);
        long f=fine(loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId());
        call(post("/api/fines/waive").content("{\"fineId\":-1,\"reason\":\"invalid\"}"),admin,400);
        call(post("/api/fines/waive").content("{\"fineId\":"+f+",\"reason\":\"first waiver\"}"),admin,200);
        call(post("/api/fines/waive").content("{\"fineId\":"+f+",\"reason\":\"duplicate waiver\"}"),admin,409);
    }
    @Test void fineDisabledPaymentAndForgedReceiptBlocked() throws Exception {
        long f=fine(loanFixture(book(genre()),BookLoanStatus.CHECKED_OUT).getId());
        call(post("/api/fines/"+f+"/pay").param("transactionId","forged"),member,400);
        call(post("/api/fines/"+f+"/pay"),member,409);
        assertEquals(0L,jdbc.queryForObject("SELECT COUNT(*) FROM payments",Long.class));
    }
    @Test void memberFineAdminActionsForbidden() throws Exception {
        call(post("/api/fines").content("{}"),member,403); call(post("/api/fines/waive").content("{}"),member,403); call(get("/api/fines"),member,403);
    }
    @Test void paymentStatusOwnershipAndDisabledGateway() throws Exception {
        long id=paymentFixture().getId(); String other=fixtureLogin("other@example.invalid",UserRole.ROLE_USER);
        assertEquals("PENDING",call(get("/api/payments/"+id+"/status"),member,200).path("status").asText());
        call(get("/api/payments/"+id+"/status"),admin,200); call(get("/api/payments/"+id+"/status"),other,403);
        call(post("/api/payments/"+id+"/reconcile"),other,403); call(post("/api/payments/"+id+"/reconcile"),member,503);
        call(post("/api/payments/webhook/payos").content("{}"),null,503); call(post("/api/payments/verify"),member,410);
        call(post("/api/subscriptions/activate").param("subscriptionId","1").param("paymentId",""+id),admin,403);
        assertEquals("PENDING",jdbc.queryForObject("SELECT status FROM payments WHERE id=?",String.class,id));
    }
    @Test void adminPaymentHistoryIsPagedAndMembersCannotReadIt() throws Exception {
        paymentFixture(); paymentFixture();
        call(get("/api/payments"),member,403);
        JsonNode page=call(get("/api/payments").param("page","0").param("size","1").param("sortBy","createdAt"),admin,200);
        assertEquals(1,page.path("content").size()); assertEquals(2,page.path("totalElements").asInt());
        assertTrue(page.path("content").get(0).path("gatewaySignature").isNull());
    }
    @Test void invalidPaymentHistoryPagingIsControlled() throws Exception {
        paymentFixture();
        call(get("/api/payments").param("page","-1"),admin,400);
        call(get("/api/payments").param("size","0"),admin,400);
        call(get("/api/payments").param("size","101"),admin,400);
        call(get("/api/payments").param("sortBy","user.password"),admin,400);
        call(get("/api/payments").param("sortDir","sideways"),admin,400);
    }
    @Test void mysqlRejectsInvalidForeignKey() throws Exception {
        long b=book(genre()); assertMysqlRejects(1452,()->jdbc.update("UPDATE books SET genre_id=-1 WHERE id=?",b));
    }
    @Test void mysqlRestrictsDeleteReferencedGenre() throws Exception {
        long g=genre(); book(g); assertMysqlRejects(1451,()->jdbc.update("DELETE FROM genres WHERE id=?",g));
    }
    @Test void mysqlRejectsDuplicateEmail() {
        assertMysqlRejects(1062,()->jdbc.update("UPDATE users SET email='step6-member@example.invalid' WHERE email='step6-admin@example.invalid'"));
    }
    @Test void mysqlRejectsDuplicateWishlistAndReview() throws Exception {
        long b=book(genre());
        call(post("/api/wishlist/add/"+b),member,200);
        assertMysqlRejects(1062,()->jdbc.update(
            "INSERT INTO wishlists(user_id,book_id,added_at) VALUES(?,?,CURRENT_TIMESTAMP)",memberUser().getId(),b));

        review(b);
        assertMysqlRejects(1062,()->jdbc.update("""
            INSERT INTO book_reviews(user_id,book_id,rating,review_text,title,is_active,created_at,updated_at)
            VALUES(?,?,4,'Step6 duplicate review text','duplicate',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
            """,memberUser().getId(),b));
    }
    @Test void mysqlRejectsInvalidPaymentStatusAndAmount() {
        long p=paymentFixture().getId();
        assertMysqlRejects(3819,()->jdbc.update("UPDATE payments SET status='INVALID' WHERE id=?",p));
        assertMysqlRejects(3819,()->jdbc.update("UPDATE payments SET amount=0 WHERE id=?",p));
        assertMysqlRejects(1048,()->jdbc.update("UPDATE payments SET currency=NULL WHERE id=?",p));
    }

    private static void assertMysqlRejects(int expectedVendorCode, org.junit.jupiter.api.function.Executable operation) {
        RuntimeException thrown=assertThrows(RuntimeException.class,operation::execute);
        SQLException sql=findSqlException(thrown);
        assertNotNull(sql,"Expected MySQL to reject the statement, but no SQLException was found in the cause chain");
        assertEquals(expectedVendorCode,sql.getErrorCode(),"Unexpected MySQL vendor error: "+sql.getMessage());
    }

    private static SQLException findSqlException(Throwable error) {
        for(Throwable current=error;current!=null;current=current.getCause())
            if(current instanceof SQLException sql) return sql;
        return null;
    }
}
