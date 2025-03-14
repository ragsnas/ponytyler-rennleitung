-- AlterTable
ALTER TABLE "Show" ADD COLUMN "actualStartTime" DATETIME;

-- CreateTable
CREATE TABLE "Shift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "showId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER,
    "shiftStarted" DATETIME,
    "shiftFinished" DATETIME,
    CONSTRAINT "Shift_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShiftRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shiftId" INTEGER NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "crewMember" TEXT NOT NULL,
    CONSTRAINT "ShiftRole_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "selectable" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "origin" TEXT NOT NULL DEFAULT 'FROM_FILE_SYNC'
);
INSERT INTO "new_Song" ("artist", "deleted", "id", "name", "origin", "selectable") SELECT "artist", "deleted", "id", "name", "origin", "selectable" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
