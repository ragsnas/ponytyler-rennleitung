SELECT
	s.artist, s.name, stats.totalCount
FROM Song s
		 LEFT JOIN (
	SELECT
		(COALESCE(s1.songId, s2.songId, 0)) AS songId,
		(COALESCE(s1.countSong1,0)+COALESCE(s2.countSong2,0)) AS totalCount
	FROM (
			 SELECT
				 r.song1Id AS songId,
				 COUNT(r.song1Id) AS countSong1
			 FROM Race r
			 GROUP BY r.song1Id
		 ) AS s1
			 LEFT OUTER JOIN (
		SELECT
			r.song2Id AS songId,
			COUNT(r.song2Id) AS countSong2
		FROM Race r
		GROUP BY r.song2Id
	) AS s2 ON (s1.songId = s2.songId)
) as stats ON (s.id = stats.songId)
WHERE s.selectable = 1 AND s.deleted = 0 AND totalCount IS NULL

