-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Show" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME,
    "duration" INTEGER,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Show" ("active", "date", "duration", "id", "name") SELECT "active", "date", "duration", "id", "name" FROM "Show";
DROP TABLE "Show";
ALTER TABLE "new_Show" RENAME TO "Show";
CREATE UNIQUE INDEX "Show_name_key" ON "Show"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
