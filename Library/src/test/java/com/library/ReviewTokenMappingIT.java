package com.library;

import com.library.model.*;
import com.library.testsupport.MySqlTestDatabase;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

/** Explicit opt-in MySQL validation and reads only; never creates schema or test records. */
class ReviewTokenMappingIT {
    @Test void validatesReviewAndResetTokenSchemaWithoutSequenceTables() throws Exception {
        var database = MySqlTestDatabase.requireConfigured();
        var configuration = new Configuration()
                .setProperty("hibernate.connection.url", database.url())
                .setProperty("hibernate.connection.username", database.username())
                .setProperty("hibernate.connection.password", database.password())
                .setProperty("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")
                .setProperty("hibernate.hbm2ddl.auto", "validate")
                .setProperty("hibernate.connection.pool_size", "1");
        for (Class<?> entity : new Class<?>[]{User.class, Genre.class, Book.class, BookReview.class, PasswordResetToken.class}) {
            configuration.addAnnotatedClass(entity);
        }
        try (var factory = configuration.buildSessionFactory(); var session = factory.openSession()) {
            session.setDefaultReadOnly(true);
            session.doWork(connection -> connection.setReadOnly(true));
            var transaction = session.beginTransaction();
            try {
                session.createSelectionQuery("from BookReview r join fetch r.user join fetch r.book", BookReview.class)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from PasswordResetToken t join fetch t.user", PasswordResetToken.class)
                        .setMaxResults(1).getResultList();
                session.doWork(connection -> {
                    try (var statement = connection.createStatement(); var result = statement.executeQuery("""
                        SELECT TABLE_NAME FROM information_schema.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('book_review_seq', 'password_reset_token_seq')
                        """)) {
                        assertThat(result.next()).as("No sequence workaround tables").isFalse();
                    }
                });
            } finally { transaction.rollback(); }
        }
    }
}
