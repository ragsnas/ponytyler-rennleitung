-- Kept here for reference; the query actually executed is the identical
-- $queryRaw call in StatsService.mostPlayedSongs() (see
-- src/prisma-api/stats.service.ts). Not wired up via Prisma's typedSql
-- codegen: that needs a live, schema-matching database at `prisma generate`
-- time, which isn't available during the backend's Docker build.
SELECT
	s.artist, s.name, stats."totalCount" AS "totalCount"
FROM "Song" s
		 INNER JOIN (
	SELECT
		(COALESCE(s1."songId", s2."songId")) AS "songId",
		(COALESCE(s1."countSong1",0)+COALESCE(s2."countSong2",0)) AS "totalCount"
	FROM (
			 SELECT
				 r."song1Id" AS "songId",
				 COUNT(r."song1Id")::int AS "countSong1"
			 FROM "Race" r
			 WHERE r.raced = true
			 GROUP BY r."song1Id"
		 ) AS s1
			 LEFT OUTER JOIN (
		SELECT
			r."song2Id" AS "songId",
			COUNT(r."song2Id")::int AS "countSong2"
		FROM "Race" r
		WHERE r.raced = true
		GROUP BY r."song2Id"
	) AS s2 ON (s1."songId" = s2."songId")
) as stats ON (s.id = stats."songId")
ORDER BY stats."totalCount" DESC
