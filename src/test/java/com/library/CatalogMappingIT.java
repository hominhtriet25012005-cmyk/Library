package com.library;

import com.library.domain.AuthProvider;
import com.library.modal.Book;
import com.library.modal.Genre;
import com.library.modal.User;
import com.library.modal.BookLoan;
import com.library.modal.Fine;
import com.library.domain.FineStatus;
import com.library.domain.ReservationStatus;
import com.library.modal.Reservation;
import com.library.modal.Wishlist;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/** Explicit opt-in: -Dtest=CatalogMappingIT. Validates existing schema; never creates data. */
class CatalogMappingIT {
    @Test
    void validatesCatalogSchemaAndReadsExistingTables() throws Exception {
        Properties application = new Properties();
        try (InputStream input = getClass().getResourceAsStream("/application.properties")) {
            application.load(input);
        }
        Configuration configuration = new Configuration()
                .addAnnotatedClass(User.class)
                .addAnnotatedClass(Genre.class)
                .addAnnotatedClass(Book.class)
                .addAnnotatedClass(BookLoan.class)
                .addAnnotatedClass(Fine.class)
                .addAnnotatedClass(Reservation.class)
                .addAnnotatedClass(Wishlist.class)
                .setProperty("hibernate.connection.url", application.getProperty("spring.datasource.url"))
                .setProperty("hibernate.connection.username", application.getProperty("spring.datasource.username"))
                .setProperty("hibernate.connection.password", application.getProperty("spring.datasource.password"))
                .setProperty("hibernate.hbm2ddl.auto", "validate")
                .setProperty("hibernate.connection.pool_size", "1");
        try (var factory = configuration.buildSessionFactory(); var session = factory.openSession()) {
            session.setDefaultReadOnly(true);
            session.doWork(connection -> connection.setReadOnly(true));
            var transaction = session.beginTransaction();
            try {
                session.createSelectionQuery("from User", User.class).setMaxResults(1).getResultList();
                session.createSelectionQuery("from Book b join fetch b.genre", Book.class)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from Genre g left join fetch g.subGenres", Genre.class)
                        .getResultList();
                session.createSelectionQuery("from BookLoan l join fetch l.user join fetch l.book", BookLoan.class)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from Fine f join fetch f.bookLoan join fetch f.user "
                        + "left join fetch f.waivedBy left join fetch f.processedBy", Fine.class)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from Reservation r join fetch r.user join fetch r.book "
                        + "where r.status = :status", Reservation.class)
                        .setParameter("status", ReservationStatus.PENDING)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from Wishlist w join fetch w.user join fetch w.book", Wishlist.class)
                        .setMaxResults(1).getResultList();
            } finally {
                transaction.rollback();
            }
        }
    }

    @Test
    void subscriptionAndPaymentBuildersPreserveDatabaseDefaults() {
        var subscription = com.library.modal.Subscription.builder().build();
        assertThat(subscription.getIsActive()).isTrue();
        assertThat(subscription.getAutoRenew()).isFalse();
        var payment = com.library.modal.Payment.builder().build();
        assertThat(payment.getCurrency()).isEqualTo("VND");
        assertThat(payment.getRetryCount()).isZero();
        assertThat(payment.getNotificationSent()).isFalse();
        assertThat(payment.getActive()).isTrue();
    }

    @Test
    void reservationBuilderPreservesDatabaseDefaults() {
        Reservation reservation = Reservation.builder().build();
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(reservation.getNotificationSent()).isFalse();
        assertThat(reservation.canBeCancelled()).isTrue();
        assertThat(reservation.hasExpired()).isFalse();
    }

    @Test
    void loanAndFineBuildersPreserveDatabaseDefaults() {
        BookLoan loan = BookLoan.builder().build();
        assertThat(loan.getRenewalCount()).isZero();
        assertThat(loan.getMaxRenewals()).isEqualTo(2);
        assertThat(loan.getIsOverdue()).isFalse();
        assertThat(loan.getOverdueDays()).isZero();
        Fine fine = Fine.builder().build();
        assertThat(fine.getAmountPaid()).isZero();
        assertThat(fine.getStatus()).isEqualTo(FineStatus.PENDING);
    }

    @Test
    void buildersPreserveDatabaseDefaults() {
        User user = User.builder().build();
        assertThat(user.getAuthProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(user.getVerified()).isFalse();
        Genre genre = Genre.builder().build();
        assertThat(genre.getActive()).isTrue();
        assertThat(genre.getDisplayOrder()).isZero();
        assertThat(genre.getSubGenres()).isEmpty();
        Book book = Book.builder().build();
        assertThat(book.getActive()).isTrue();
        assertThat(book.getTotalCopies()).isZero();
        assertThat(book.getAvailableCopies()).isZero();
    }
}
