SELECT
	COUNT(r.bikeWon) as timesWon, r.bikeWon
FROM Race r
GROUP BY r.bikeWon
ORDER BY timesWon DESC
