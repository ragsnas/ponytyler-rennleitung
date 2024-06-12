-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "selectable" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "origin" TEXT NOT NULL DEFAULT 'LEGACY',
    "fromVideoFiles" BOOLEAN NOT NULL DEFAULT false,
    "fromDirectInput" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Song" ("artist", "deleted", "id", "name", "selectable") SELECT "artist", "deleted", "id", "name", "selectable" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
