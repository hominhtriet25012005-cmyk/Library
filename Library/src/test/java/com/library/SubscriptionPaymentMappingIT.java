package com.library;

import com.library.model.*;
import com.library.testsupport.MySqlTestDatabase;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.Test;

/** Explicit opt-in: -Dtest=SubscriptionPaymentMappingIT. No schema/data writes.
 * Remains blocked until the subscription plan schema decisions in stage 4 are resolved.
 */
class SubscriptionPaymentMappingIT {
    @Test
    void validatesSubscriptionAndPaymentSchema() throws Exception {
        var database = MySqlTestDatabase.requireConfigured();
        Configuration configuration = new Configuration()
                .addAnnotatedClass(User.class)
                .addAnnotatedClass(Genre.class)
                .addAnnotatedClass(Book.class)
                .addAnnotatedClass(BookLoan.class)
                .addAnnotatedClass(Fine.class)
                .addAnnotatedClass(SubscriptionPlan.class)
                .addAnnotatedClass(Subscription.class)
                .addAnnotatedClass(Payment.class)
                .setProperty("hibernate.physical_naming_strategy",
                        "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")
                .setProperty("hibernate.connection.url", database.url())
                .setProperty("hibernate.connection.username", database.username())
                .setProperty("hibernate.connection.password", database.password())
                .setProperty("hibernate.hbm2ddl.auto", "validate")
                .setProperty("hibernate.connection.pool_size", "1");
        try (var factory = configuration.buildSessionFactory(); var session = factory.openSession()) {
            session.setDefaultReadOnly(true);
            session.doWork(connection -> connection.setReadOnly(true));
            var transaction = session.beginTransaction();
            try {
                session.createSelectionQuery("from SubscriptionPlan", SubscriptionPlan.class)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from Subscription", Subscription.class)
                        .setMaxResults(1).getResultList();
                session.createSelectionQuery("from Payment", Payment.class)
                        .setMaxResults(1).getResultList();
            } finally {
                transaction.rollback();
            }
        }
    }
}
