package com.library;

import com.library.modal.*;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Properties;

/** Explicit opt-in: -Dtest=SubscriptionPaymentMappingIT. No schema/data writes.
 * Remains blocked until the subscription plan schema decisions in stage 4 are resolved.
 */
class SubscriptionPaymentMappingIT {
    @Test
    void validatesSubscriptionAndPaymentSchema() throws Exception {
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
                .addAnnotatedClass(SubscriptionPlan.class)
                .addAnnotatedClass(Subscription.class)
                .addAnnotatedClass(Payment.class)
                .setProperty("hibernate.physical_naming_strategy",
                        "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")
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
