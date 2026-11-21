import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Explicit one-shot migration for the approved B0 group 1 only. No data deletion/backfill. */
class B0Group1Migration {
    private static final String ALTER = """
        ALTER TABLE library_db1.subscription_plans
            ADD COLUMN plan_code VARCHAR(100) NOT NULL,
            ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'VND',
            ADD COLUMN max_books_allowed INT NOT NULL,
            ADD COLUMN max_days_per_book INT NOT NULL,
            ADD COLUMN display_order INT NOT NULL DEFAULT 0,
            ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN badge_text VARCHAR(255) NULL,
            ADD COLUMN admin_notes VARCHAR(255) NULL,
            ADD COLUMN created_by VARCHAR(150) NULL,
            ADD COLUMN updated_by VARCHAR(150) NULL,
            ADD CONSTRAINT uq_subscription_plans_plan_code UNIQUE (plan_code)
        """;

    public static void main(String[] args) throws Exception {
        if (args.length != 1 || !"--apply-b0-group1".equals(args[0]))
            throw new IllegalArgumentException("Explicit --apply-b0-group1 required; never rerun blindly");
        Properties config = new Properties();
        try (var input = Files.newInputStream(Path.of("Library/src/main/resources/application.properties"))) {
            config.load(input);
        }
        String url = config.getProperty("spring.datasource.url");
        if (!"jdbc:mysql://localhost:3306/library_db1".equals(url))
            throw new IllegalStateException("Unexpected database target");
        Properties credentials = new Properties();
        credentials.setProperty("user", config.getProperty("spring.datasource.username"));
        credentials.setProperty("password", config.getProperty("spring.datasource.password"));
        credentials.setProperty("connectTimeout", "5000");
        credentials.setProperty("socketTimeout", "30000");
        try (var connection = DriverManager.getConnection(url, credentials); var statement = connection.createStatement()) {
            statement.execute("SET SESSION lock_wait_timeout=10");
            // Prevent another writer from inserting rows between the empty-table check and ALTER.
            statement.execute("LOCK TABLES library_db1.subscription_plans WRITE");
            try {
                if (count(statement) != 0) throw new IllegalStateException("Table is no longer empty; approved backfill required");
                Set<String> expected = Set.of("id", "title", "description", "price", "duration_in_days",
                        "billing_cycle", "trial_days", "max_users_allowed", "features", "auto_renew", "active", "created_at", "updated_at");
                Set<String> actual = new HashSet<>();
                try (var result = statement.executeQuery("SHOW COLUMNS FROM library_db1.subscription_plans")) {
                    while (result.next()) actual.add(result.getString("Field"));
                }
                if (!actual.equals(expected)) throw new IllegalStateException("Schema changed or migration already applied; stop for review");
                String before = ddl(statement);
                String stamp = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
                Path directory = Path.of("database/backups/b0_group1_" + stamp);
                Files.createDirectory(directory);
                String backup = "-- Pre-B0 group 1 backup of EMPTY library_db1.subscription_plans.\n"
                        + "-- No rows existed under table write lock. Schema-only backup is complete for this target.\n"
                        + "-- For recovery planning only. Do not execute blindly against an existing table.\n"
                        + "USE library_db1;\n" + before + ";\n";
                Path backupPath = directory.resolve("subscription_plans.before.sql");
                Files.writeString(backupPath, backup, StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
                if (!Files.readString(backupPath).equals(backup)) throw new IllegalStateException("Backup verification failed");
                String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(backupPath)));
                Files.writeString(directory.resolve("backup.sha256"), hash + "  subscription_plans.before.sql\n", StandardOpenOption.CREATE_NEW);
                Files.writeString(directory.resolve("applied.sql"), ALTER + ";\n", StandardOpenOption.CREATE_NEW);
                System.out.println("BACKUP=" + backupPath.toAbsolutePath());
                System.out.println("BACKUP_SHA256=" + hash);
                System.out.println("PREFLIGHT: 13 original columns, 0 rows; write lock held");
                statement.executeUpdate(ALTER);
                String after = ddl(statement);
                long remainingRows = count(statement);
                Files.writeString(directory.resolve("subscription_plans.after.sql"), after + ";\n", StandardOpenOption.CREATE_NEW);
                System.out.println("ALTER_SUCCESS; rows=" + remainingRows);
                System.out.println(after);
            } finally { statement.execute("UNLOCK TABLES"); }
        } catch (SQLException ex) {
            System.err.println("Migration stopped: SQLState=" + ex.getSQLState() + ", vendorCode=" + ex.getErrorCode()
                    + ". Inspect live schema before any retry; DDL is not rolled back.");
            System.exit(1);
        }
    }
    private static long count(Statement statement) throws SQLException {
        try (var result = statement.executeQuery("SELECT COUNT(*) FROM library_db1.subscription_plans")) {
            result.next(); return result.getLong(1);
        }
    }
    private static String ddl(Statement statement) throws SQLException {
        try (var result = statement.executeQuery("SHOW CREATE TABLE library_db1.subscription_plans")) {
            result.next(); return result.getString(2);
        }
    }
}
