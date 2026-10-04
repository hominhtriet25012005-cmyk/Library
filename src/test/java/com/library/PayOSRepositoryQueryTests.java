package com.library;

import com.library.modal.*;
import com.library.repository.*;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

/** Parse JPQL against mappings without connecting to MySQL or generating schema. */
class PayOSRepositoryQueryTests {
    @Test void newQueriesMatchEntityAttributes() {
        var configuration = new Configuration()
                .setProperty("hibernate.dialect", "org.hibernate.dialect.MySQLDialect")
                .setProperty("hibernate.boot.allow_jdbc_metadata_access", "false")
                .setProperty("hibernate.hbm2ddl.auto", "none")
                .setProperty("hibernate.connection.provider_class",
                        "org.hibernate.engine.jdbc.connections.internal.UserSuppliedConnectionProviderImpl");
        for (Class<?> entity : new Class<?>[]{User.class, Genre.class, Book.class, BookLoan.class,
                Fine.class, Reservation.class, Wishlist.class, SubscriptionPlan.class, Subscription.class, Payment.class}) {
            configuration.addAnnotatedClass(entity);
        }
        try (var factory = configuration.buildSessionFactory(); var session = factory.openSession()) {
            for (Class<?> repository : new Class<?>[]{UserRepository.class, SubscriptionRepository.class, PaymentRepository.class, FineRepository.class}) {
                for (var method : repository.getDeclaredMethods()) {
                    if (method.getName().equals("findAwaitingPayment") || method.getName().equals("findLockedById")) {
                        session.createSelectionQuery(method.getAnnotation(Query.class).value(), Object.class);
                    }
                }
            }
        }
    }
}
