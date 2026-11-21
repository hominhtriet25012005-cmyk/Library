import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** Standalone read-only diagnostic. Never executes project migration SQL or prints credentials. */
class SchemaReadOnlyCheck {
    public static void main(String[] args) throws Exception {
        Properties config = new Properties();
        try (var input = Files.newInputStream(Path.of(args[0]))) { config.load(input); }
        String url = config.getProperty("spring.datasource.url");
        if (!"jdbc:mysql://localhost:3306/library_db1".equals(url)) {
            throw new IllegalStateException("Unexpected datasource; review target before running diagnostic");
        }
        Properties credentials = new Properties();
        credentials.setProperty("user", config.getProperty("spring.datasource.username"));
        credentials.setProperty("password", config.getProperty("spring.datasource.password"));
        credentials.setProperty("connectTimeout", "5000");
        credentials.setProperty("socketTimeout", "15000");
        try (Connection connection = DriverManager.getConnection(url, credentials)) {
            connection.setReadOnly(true);
            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                statement.execute("START TRANSACTION READ ONLY");
                query(statement, "SELECT DATABASE() AS db, VERSION() AS version, @@session.transaction_read_only AS read_only");
                var tables = new ArrayList<String>();
                try (var result = statement.executeQuery("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='library_db1' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME")) {
                    while (result.next()) tables.add(result.getString(1));
                }
                for (String table : tables) {
                    if (!table.matches("[a-zA-Z0-9_]+")) throw new IllegalStateException("Unexpected table name");
                    System.out.println("TABLE " + table);
                    query(statement, "SELECT COUNT(*) AS row_count FROM `library_db1`.`" + table + "`");
                    query(statement, "SHOW CREATE TABLE `library_db1`.`" + table + "`");
                }
            } finally { connection.rollback(); }
        } catch (SQLException ex) {
            System.err.println("MySQL diagnostic failed: SQLState=" + ex.getSQLState() + ", vendorCode=" + ex.getErrorCode());
            System.exit(1);
        }
    }
    private static void query(Statement statement, String sql) throws SQLException {
        try (var result = statement.executeQuery(sql)) {
            var metadata = result.getMetaData();
            while (result.next()) {
                for (int column = 1; column <= metadata.getColumnCount(); column++) {
                    System.out.println(metadata.getColumnLabel(column) + "=" + result.getString(column));
                }
            }
        }
    }
}
