package com.library.testsupport;

import java.util.Locale;

/**
 * Resolves the explicitly configured MySQL test database and refuses to use a
 * production/development catalog. Integration tests must never fall back to
 * application.properties because that file points at library_db1 by default.
 */
public final class MySqlTestDatabase {

    private static final String URL_PROPERTY = "test.mysql.url";
    private static final String USERNAME_PROPERTY = "test.mysql.username";
    private static final String PASSWORD_PROPERTY = "test.mysql.password";

    private MySqlTestDatabase() {
    }

    public static Config requireConfigured() {
        String url = value(URL_PROPERTY, "TEST_DB_URL");
        String username = value(USERNAME_PROPERTY, "TEST_DB_USERNAME");
        String password = optionalValue(PASSWORD_PROPERTY, "TEST_DB_PASSWORD");

        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "Thiếu TEST_DB_URL. Hãy cấu hình database MySQL thử nghiệm có tên kết thúc bằng _test.");
        }
        if (username == null || username.isBlank()) {
            throw new IllegalStateException("Thiếu TEST_DB_USERNAME cho database MySQL thử nghiệm.");
        }

        String databaseName = databaseName(url);
        requireTestDatabaseName(databaseName);
        return new Config(url, username, password == null ? "" : password, databaseName);
    }

    static void requireTestDatabaseName(String databaseName) {
        String normalized = databaseName.toLowerCase(Locale.ROOT);
        if (normalized.equals("library_db1")) {
            throw new IllegalStateException("Từ chối chạy test trên database chính library_db1.");
        }
        if (!normalized.endsWith("_test")) {
            throw new IllegalStateException(
                    "Từ chối chạy test trên database '" + databaseName
                            + "'. Tên database thử nghiệm bắt buộc kết thúc bằng _test.");
        }
    }

    static String databaseName(String url) {
        if (url == null || !url.toLowerCase(Locale.ROOT).startsWith("jdbc:mysql://")) {
            throw new IllegalStateException("TEST_DB_URL phải là JDBC MySQL URL (jdbc:mysql://...).");
        }
        int queryIndex = url.indexOf('?');
        String withoutQuery = queryIndex >= 0 ? url.substring(0, queryIndex) : url;
        int slashIndex = withoutQuery.lastIndexOf('/');
        if (slashIndex < "jdbc:mysql://".length() || slashIndex == withoutQuery.length() - 1) {
            throw new IllegalStateException("TEST_DB_URL phải chứa tên database.");
        }
        String databaseName = withoutQuery.substring(slashIndex + 1);
        if (!databaseName.matches("[A-Za-z0-9_$-]+")) {
            throw new IllegalStateException("Tên database thử nghiệm không hợp lệ: " + databaseName);
        }
        return databaseName;
    }

    private static String value(String property, String environmentVariable) {
        String configured = optionalValue(property, environmentVariable);
        return configured == null || configured.isBlank() ? null : configured;
    }

    private static String optionalValue(String property, String environmentVariable) {
        String configured = System.getProperty(property);
        if (configured == null || configured.isBlank()) {
            configured = System.getenv(environmentVariable);
        }
        return configured;
    }

    public record Config(String url, String username, String password, String databaseName) {
    }
}
