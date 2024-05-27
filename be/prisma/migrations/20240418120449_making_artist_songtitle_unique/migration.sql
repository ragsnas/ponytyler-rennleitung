/*
  Warnings:

  - A unique constraint covering the columns `[artist,name]` on the table `Song` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Song_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Song_artist_name_key" ON "Song"("artist", "name");
