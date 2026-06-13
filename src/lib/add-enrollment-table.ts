import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

async function addEnrollmentTable() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Enrollment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_userId_courseId_key"
      ON "Enrollment"("userId", "courseId");
    `);

    console.log("✅ Enrollment table created successfully on Turso!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.close();
  }
}

addEnrollmentTable();
