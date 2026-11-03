package com.library.testsupport;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MySqlTestDatabaseTests {

    @Test
    void extractsDatabaseNameFromJdbcUrl() {
        assertThat(MySqlTestDatabase.databaseName(
                "jdbc:mysql://127.0.0.1:3306/library_db1_test?useSSL=false"))
                .isEqualTo("library_db1_test");
    }

    @Test
    void rejectsNonMySqlUrl() {
        assertThatThrownBy(() -> MySqlTestDatabase.databaseName("jdbc:h2:mem:library_test"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JDBC MySQL URL");
    }

    @Test
    void rejectsUrlWithoutDatabaseName() {
        assertThatThrownBy(() -> MySqlTestDatabase.databaseName("jdbc:mysql://127.0.0.1:3306/"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tên database");
    }

    @Test
    void acceptsOnlyDatabaseNamesEndingInTest() {
        MySqlTestDatabase.requireTestDatabaseName("library_db1_test");

        assertThatThrownBy(() -> MySqlTestDatabase.requireTestDatabaseName("library_db1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("database chính library_db1");
    }
}
