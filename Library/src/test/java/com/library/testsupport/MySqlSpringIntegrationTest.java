package com.library.testsupport;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Shared datasource override for Spring-based MySQL integration tests. */
public abstract class MySqlSpringIntegrationTest {

    private static final MySqlTestDatabase.Config DATABASE = MySqlTestDatabase.requireConfigured();

    @DynamicPropertySource
    static void mysqlTestDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DATABASE::url);
        registry.add("spring.datasource.username", DATABASE::username);
        registry.add("spring.datasource.password", DATABASE::password);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.sql.init.mode", () -> "never");
    }

    protected static String expectedDatabaseName() {
        return DATABASE.databaseName();
    }
}
