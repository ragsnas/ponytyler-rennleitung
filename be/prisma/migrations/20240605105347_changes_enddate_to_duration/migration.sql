/*
  Warnings:

  - You are about to drop the column `endDate` on the `Show` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Show" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME,
    "duration" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Show" ("active", "date", "id", "name") SELECT "active", "date", "id", "name" FROM "Show";
DROP TABLE "Show";
ALTER TABLE "new_Show" RENAME TO "Show";
CREATE UNIQUE INDEX "Show_name_key" ON "Show"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
