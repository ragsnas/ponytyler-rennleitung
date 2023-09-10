/*
  Warnings:

  - Added the required column `artist` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL
);
INSERT INTO "new_Song" ("id", "name") SELECT "id", "name" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE UNIQUE INDEX "Song_name_key" ON "Song"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
