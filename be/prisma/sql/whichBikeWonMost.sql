-- Kept here for reference; the query actually executed is the identical
-- $queryRaw call in StatsService.whichBikeWonMost() (see
-- src/prisma-api/stats.service.ts). Not wired up via Prisma's typedSql
-- codegen: that needs a live, schema-matching database at `prisma generate`
-- time, which isn't available during the backend's Docker build.
SELECT
	COUNT(r."bikeWon")::int as "timesWon", r."bikeWon"
FROM "Race" r
GROUP BY r."bikeWon"
ORDER BY "timesWon" DESC
