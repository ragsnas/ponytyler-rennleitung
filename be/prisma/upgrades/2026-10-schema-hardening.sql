-- One-off upgrade for an EXISTING Postgres database created from the previous
-- schema (see Refactoring.md, D2). Run it once, BEFORE `prisma db push`:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/upgrades/2026-10-schema-hardening.sql
--
-- Why not just `prisma db push --accept-data-loss`? For Race.raceState
-- (text -> enum RaceState) Prisma would DROP the column and re-add it with the
-- default 'LISTED', resetting the state of every race. This script converts the
-- column in place and keeps the data. A fresh database does not need it.
--
-- Everything runs in one transaction: it either applies completely or not at all.

BEGIN;

-- The new unique constraints cannot be created over duplicate order numbers.
-- Fix those first (the "Repair Order" button on the show dashboard renumbers a show's races).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Race" GROUP BY "showId", "orderNumber" HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Race has duplicate (showId, orderNumber) pairs; run "Repair Order" for the affected shows first';
  END IF;
  IF EXISTS (
    SELECT 1 FROM encore_songs GROUP BY "showId", "order" HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'encore_songs has duplicate (showId, order) pairs; fix them first';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Race"
    WHERE "raceState" NOT IN (
      'WAITING_FOR_OPPONENT', 'CANCELED', 'LISTED', 'WAITING_TO_RACE',
      'RACING', 'RACED', 'ERROR', 'VIDEO_PLAYING', 'DONE'
    )
  ) THEN
    RAISE EXCEPTION 'Race.raceState contains a value that is not part of the RaceState enum';
  END IF;
END $$;

-- Race.raceState: text -> RaceState (data preserving)
ALTER TABLE "Race" ALTER COLUMN "raceState" DROP DEFAULT;
ALTER TABLE "Race"
  ALTER COLUMN "raceState" TYPE "RaceState" USING "raceState"::"RaceState";
ALTER TABLE "Race" ALTER COLUMN "raceState" SET DEFAULT 'LISTED';

-- ShiftRole.pastUserName was never written
ALTER TABLE "ShiftRole" DROP COLUMN "pastUserName";

-- Unique constraints
CREATE UNIQUE INDEX "Race_showId_orderNumber_key" ON "Race"("showId", "orderNumber");
CREATE UNIQUE INDEX "encore_songs_showId_order_key" ON "encore_songs"("showId", "order");

-- Referential actions: deleting a show now removes its races, shifts, shift
-- roles and encore songs.
ALTER TABLE "Race" DROP CONSTRAINT "Race_showId_fkey";
ALTER TABLE "Race" ADD CONSTRAINT "Race_showId_fkey"
  FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Shift" DROP CONSTRAINT "Shift_showId_fkey";
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_showId_fkey"
  FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShiftRole" DROP CONSTRAINT "ShiftRole_shiftId_fkey";
ALTER TABLE "ShiftRole" ADD CONSTRAINT "ShiftRole_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encore_songs" DROP CONSTRAINT "encore_songs_showId_fkey";
ALTER TABLE "encore_songs" ADD CONSTRAINT "encore_songs_showId_fkey"
  FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
