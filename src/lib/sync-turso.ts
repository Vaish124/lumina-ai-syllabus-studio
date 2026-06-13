import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

async function sync() {
  const remoteUrl = process.env.DATABASE_URL;
  const remoteToken = process.env.DATABASE_AUTH_TOKEN;

  if (!remoteUrl || remoteUrl.startsWith("file:")) {
    console.error("Please configure a remote DATABASE_URL in your .env file first.");
    process.exit(1);
  }

  const localDbPath = "file:" + path.join(process.cwd(), "dev.db");
  console.log(`Connecting to local SQLite database at: ${localDbPath}`);
  const localClient = createClient({
    url: localDbPath,
  });

  console.log(`Connecting to remote Turso database at: ${remoteUrl}`);
  const remoteClient = createClient({
    url: remoteUrl,
    authToken: remoteToken,
  });

  try {
    // 1. Get all table creation SQLs from local sqlite_schema
    const tablesRes = await localClient.execute(
      "SELECT name, sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"
    );

    console.log(`Found ${tablesRes.rows.length} tables to sync.`);

    // 2. Create tables on Turso
    for (const row of tablesRes.rows) {
      const tableName = row.name as string;
      const createSql = row.sql as string;

      console.log(`Creating table '${tableName}' on Turso...`);
      // Drop first to ensure fresh sync
      await remoteClient.execute(`DROP TABLE IF EXISTS "${tableName}";`);
      await remoteClient.execute(createSql);
    }

    // 3. Get indexes creation SQLs
    const indexesRes = await localClient.execute(
      "SELECT name, sql FROM sqlite_schema WHERE type='index' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' AND sql IS NOT NULL;"
    );
    for (const row of indexesRes.rows) {
      const indexSql = row.sql as string;
      console.log(`Creating index: ${row.name}`);
      try {
        await remoteClient.execute(indexSql);
      } catch (err: any) {
        console.warn(`Warning: index creation skipped: ${err.message}`);
      }
    }

    console.log("All schemas synchronized successfully to Turso!");
  } catch (error) {
    console.error("Sync failed:", error);
    process.exit(1);
  } finally {
    localClient.close();
    remoteClient.close();
  }
}

sync();
