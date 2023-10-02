-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Race" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "showId" INTEGER NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "raced" BOOLEAN NOT NULL DEFAULT false,
    "person1" TEXT NOT NULL,
    "song1Id" INTEGER NOT NULL,
    "person2" TEXT NOT NULL,
    "song2Id" INTEGER NOT NULL,
    "bikeWon" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Race_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Race_song1Id_fkey" FOREIGN KEY ("song1Id") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Race_song2Id_fkey" FOREIGN KEY ("song2Id") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Race" ("createdAt", "id", "orderNumber", "person1", "person2", "raced", "showId", "song1Id", "song2Id") SELECT "createdAt", "id", "orderNumber", "person1", "person2", "raced", "showId", "song1Id", "song2Id" FROM "Race";
DROP TABLE "Race";
ALTER TABLE "new_Race" RENAME TO "Race";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
