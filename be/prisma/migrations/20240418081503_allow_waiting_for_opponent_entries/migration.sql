-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Race" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "showId" INTEGER NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "raced" BOOLEAN NOT NULL DEFAULT false,
    "raceState" TEXT NOT NULL DEFAULT 'WAITING_TO_RACE',
    "person1" TEXT,
    "song1Id" INTEGER,
    "person2" TEXT,
    "song2Id" INTEGER,
    "bikeWon" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Race_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Race_song1Id_fkey" FOREIGN KEY ("song1Id") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Race_song2Id_fkey" FOREIGN KEY ("song2Id") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Race" ("bikeWon", "createdAt", "id", "orderNumber", "person1", "person2", "raceState", "raced", "showId", "song1Id", "song2Id") SELECT "bikeWon", "createdAt", "id", "orderNumber", "person1", "person2", "raceState", "raced", "showId", "song1Id", "song2Id" FROM "Race";
DROP TABLE "Race";
ALTER TABLE "new_Race" RENAME TO "Race";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
