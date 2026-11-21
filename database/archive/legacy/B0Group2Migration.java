import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Explicit one-shot group 2 runner. Never drops/updates existing tables or inserts records. */
class B0Group2Migration {
    public static void main(String[] args) throws Exception {
        if (args.length != 1 || !args[0].equals("--apply-b0-group2"))
            throw new IllegalArgumentException("Explicit --apply-b0-group2 required");
        var config = new Properties();
        try (var input = Files.newInputStream(Path.of("Library/src/main/resources/application.properties"))) { config.load(input); }
        String url = config.getProperty("spring.datasource.url");
        if (!"jdbc:mysql://localhost:3306/library_db1".equals(url)) throw new IllegalStateException("Unexpected target");
        var credentials = new Properties();
        credentials.setProperty("user", config.getProperty("spring.datasource.username"));
        credentials.setProperty("password", config.getProperty("spring.datasource.password"));
        credentials.setProperty("connectTimeout", "5000");
        credentials.setProperty("socketTimeout", "30000");
        String sql = Files.readString(Path.of("database/archive/legacy/b0_group2.sql"));
        var statements = Arrays.stream(sql.replaceAll("(?m)^--.*$", "").split(";"))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (statements.size() != 2 || !statements.get(0).startsWith("CREATE TABLE library_db1.book_reviews (")
                || !statements.get(1).startsWith("CREATE TABLE library_db1.password_reset_tokens ("))
            throw new IllegalStateException("Unexpected migration statements");
        try (var connection = DriverManager.getConnection(url, credentials); var statement = connection.createStatement()) {
            statement.execute("SET SESSION lock_wait_timeout=10");
            List<String> tables = new ArrayList<>();
            try (var result = statement.executeQuery("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='library_db1' ORDER BY TABLE_NAME")) {
                while (result.next()) tables.add(result.getString(1));
            }
            if (!new HashSet<>(tables).equals(Set.of("book_loans", "books", "fines", "genres", "payments", "reservations",
                    "subscription_plans", "subscriptions", "users", "wishlists")))
                throw new IllegalStateException("Schema changed/targets already exist; inspect before retry");
            // Schema-only backup: abort if there are any data rows rather than claim a data backup.
            connection.setReadOnly(true); connection.setAutoCommit(false);
            StringBuilder before = new StringBuilder("-- Pre-B0 group 2 schema snapshot. All 10 tables empty in read-only snapshot.\n-- No DROP/restore automation. Do not execute against existing tables.\nUSE library_db1;\n");
            try {
                for (String table : tables) {
                    try (var result = statement.executeQuery("SELECT COUNT(*) FROM library_db1.`" + table + "`")) {
                        result.next(); if (result.getLong(1) != 0) throw new IllegalStateException("Nonempty database: data backup required first");
                    }
                    before.append(ddl(statement, table)).append(";\n\n");
                }
            } finally { connection.rollback(); connection.setAutoCommit(true); connection.setReadOnly(false); }
            String stamp = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
            Path directory = Path.of("database/backups/b0_group2_" + stamp);
            Files.createDirectory(directory);
            Path backup = directory.resolve("schema.before.sql");
            Files.writeString(backup, before, StandardOpenOption.CREATE_NEW);
            if (!Files.readString(backup).equals(before.toString())) throw new IllegalStateException("Backup verification failed");
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(backup)));
            Files.writeString(directory.resolve("backup.sha256"), hash + "  schema.before.sql\n", StandardOpenOption.CREATE_NEW);
            Files.writeString(directory.resolve("applied.sql"), sql, StandardOpenOption.CREATE_NEW);
            System.out.println("PREFLIGHT: 10 existing tables, 0 rows, both target tables absent");
            System.out.println("BACKUP=" + backup.toAbsolutePath());
            System.out.println("SHA256=" + hash);
            for (int i = 0; i < statements.size(); i++) {
                String table = i == 0 ? "book_reviews" : "password_reset_tokens";
                statement.executeUpdate(statements.get(i));
                Files.writeString(directory.resolve(table + ".after.sql"), ddl(statement, table) + ";\n", StandardOpenOption.CREATE_NEW);
                System.out.println("CREATED " + table);
            }
            System.out.println("GROUP2_SUCCESS; no existing table altered; no rows inserted");
        } catch (SQLException ex) {
            System.err.println("SQLState=" + ex.getSQLState() + "; vendorCode=" + ex.getErrorCode()
                    + "; stop and inspect actual schema. DDL may be partially committed; never blindly rerun/drop tables.");
            System.exit(1);
        }
    }
    static String ddl(Statement statement, String table) throws SQLException {
        try (var result = statement.executeQuery("SHOW CREATE TABLE library_db1.`" + table + "`")) {
            result.next(); return result.getString(2);
        }
    }
}
