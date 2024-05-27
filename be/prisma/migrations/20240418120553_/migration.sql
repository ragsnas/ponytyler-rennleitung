/*
  Warnings:

  - A unique constraint covering the columns `[artist,name,deleted]` on the table `Song` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Song_artist_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Song_artist_name_deleted_key" ON "Song"("artist", "name", "deleted");
