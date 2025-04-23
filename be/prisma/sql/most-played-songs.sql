SELECT
	s.artist, s.name, stats.totalCount
FROM Song s
		 INNER JOIN (
	SELECT
		(COALESCE(s1.songId, s2.songId, 0)) AS songId,
		(COALESCE(s1.count,0)+COALESCE(s2.count,0)) AS totalCount
	FROM (
		SELECT r.song2Id songId, COUNT(r.song2Id) AS count
		FROM Race r
		WHERE r.bikeWon = 1
		GROUP BY r.song2Id) AS s1
	LEFT OUTER JOIN (
		SELECT r.song1Id songId, COUNT(r.song1Id) AS count
		FROM Race r
		WHERE r.bikeWon = 1
		GROUP BY r.song1Id) AS s2 ON (s1.songId = s2.songId)
) AS stats ON stats.songId = s.id

ORDER BY totalCount DESC