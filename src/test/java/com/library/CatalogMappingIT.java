package com.library;

import com.library.domain.AuthProvider;
import com.library.modal.Book;
import com.library.modal.Genre;
import com.library.modal.User;
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
            } finally {
                transaction.rollback();
            }
        }
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
