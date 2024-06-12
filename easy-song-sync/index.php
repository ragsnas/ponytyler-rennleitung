<?php
	include('../db_sec_login/dbconfig.php'); // Stellen Sie sicher, dass der Pfad zur dbconfig.php korrekt ist
	$conn = new mysqli($servername, $username, $password, $dbname);

	$conn->set_charset("utf8mb4");

	// Verbindung überprüfen
	if ($conn->connect_error) {
		die("Verbindung fehlgeschlagen: " . $conn->connect_error);
	}

	// Zuerst alle Künstler abfragen, sortiert nach angepassten Bedingungen
	$allSongsQuery = "SELECT kuenstler.name as artist, titel.name AS title FROM titel LEFT JOIN kuenstler ON titel.kuenstler_id = kuenstler.id ORDER BY kuenstler.name, titel.name";
	$allSongsResult = $conn->query($allSongsQuery);
	$allSongs = $allSongsResult->fetch_all(MYSQLI_ASSOC);

	header('Content-Type: application/json');
	echo json_encode(array_merge($allSongs));
	exit();