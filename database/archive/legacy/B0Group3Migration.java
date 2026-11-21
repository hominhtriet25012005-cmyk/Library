import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Explicit one-shot migration for the approved B0 group 3 only. No data deletion/backfill. */
class B0Group3Migration {
    private static final String ALTER = """
        ALTER TABLE library_db1.payments
            ALTER COLUMN currency SET DEFAULT 'VND',
            DROP CHECK chk_payments_status,
            ADD CONSTRAINT chk_payments_status
                CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'))
        """;

    public static void main(String[] args) throws Exception {
        if (args.length != 1 || !"--apply-b0-group3".equals(args[0]))
            throw new IllegalArgumentException("Explicit --apply-b0-group3 required; never rerun blindly");
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
            statement.execute("LOCK TABLES library_db1.payments WRITE");
            try {
                if (count(statement) != 0) throw new IllegalStateException("Table is no longer empty; approved backfill required");
                String before = ddl(statement);
                String check = before.lines().filter(line -> line.contains("CONSTRAINT `chk_payments_status`")).findFirst().orElseThrow();
                var values = new HashSet<String>();
                var matcher = java.util.regex.Pattern.compile("'([A-Z_]+)'").matcher(check);
                while (matcher.find()) values.add(matcher.group(1));
                if (!values.equals(Set.of("PENDING", "SUCCESS", "FAILED", "CANCELLED"))
                        || !check.contains("CHECK") || check.contains("NOT ENFORCED")
                        || !before.contains("`currency` varchar(3) NOT NULL DEFAULT 'INR'"))
                    throw new IllegalStateException("Unexpected CHECK/default or already applied; stop for review");
                String stamp = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
                Path directory = Path.of("database/backups/b0_group3_" + stamp);
                Files.createDirectory(directory);
                String backup = "-- Pre-B0 group 3 backup of EMPTY library_db1.payments.\n"
                        + "-- No rows existed under table write lock. Schema-only backup is complete for this target.\n"
                        + "-- For recovery planning only. Do not execute blindly against an existing table.\n"
                        + "USE library_db1;\n" + before + ";\n";
                Path backupPath = directory.resolve("payments.before.sql");
                Files.writeString(backupPath, backup, StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
                if (!Files.readString(backupPath).equals(backup)) throw new IllegalStateException("Backup verification failed");
                String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(backupPath)));
                Files.writeString(directory.resolve("backup.sha256"), hash + "  payments.before.sql\n", StandardOpenOption.CREATE_NEW);
                Files.writeString(directory.resolve("applied.sql"), ALTER + ";\n", StandardOpenOption.CREATE_NEW);
                System.out.println("BACKUP=" + backupPath.toAbsolutePath());
                System.out.println("BACKUP_SHA256=" + hash);
                System.out.println("PREFLIGHT: original four-state CHECK enforced, INR default, 0 rows; write lock held");
                statement.executeUpdate(ALTER);
                String after = ddl(statement);
                if (!after.contains("'PROCESSING'") || !after.contains("`currency` varchar(3) NOT NULL DEFAULT 'VND'"))
                    throw new IllegalStateException("Post-migration verification failed; inspect live schema");
                long remainingRows = count(statement);
                Files.writeString(directory.resolve("payments.after.sql"), after + ";\n", StandardOpenOption.CREATE_NEW);
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
        try (var result = statement.executeQuery("SELECT COUNT(*) FROM library_db1.payments")) {
            result.next(); return result.getLong(1);
        }
    }
    private static String ddl(Statement statement) throws SQLException {
        try (var result = statement.executeQuery("SHOW CREATE TABLE library_db1.payments")) {
            result.next(); return result.getString(2);
        }
    }
}
