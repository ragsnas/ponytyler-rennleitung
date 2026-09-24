const VENUENAMES = [
  "Aladdin Theater", "Alberta Street Pub", "Antoinette Hatfield Hall",
  "Arlene Schnitzer Concert Hall", "Crystal Ballroom", "Dante's",
  "Doug Fir Lounge", "Hawthorne Theatre", "Holocene", "Jack London Revue",
  "Keller Auditorium", "Lola's Room", "Mississippi Studios", "Moda Center",
  "Oregon Zoo", "Revolution Hall", "Roseland Theater",
  "Spare Room Restaurant and Lounge", "Star Theater",
  "Veterans Memorial Coliseum", "Wonder Ballroom", "World Famous Kenton Club",
  "40 Watt Club", "100 Club", "924 Gilman Street", "A7", "ABC No Rio",
  "The Anthrax", "Les Bains Douches", "Band on the Wall",
  "Brighton Bar", "The Casbah", "CBGB", "The Channel",
  "Charm City Art Space", "Ché Café", "City Gardens", "Club Babyhead",
  "Court Tavern", "Crystal Ballroom", "Cuckoo's Nest",
  "Doll Hut", "Double Down Saloon", "The Echo", "F Club",
  "Les Foufounes Électriques", "The Great Gildersleeves",
  "Harpers Ferry", "Hong Kong Café", "Jabberjaw",
  "The Know", "Lemp Neighborhood Arts Center",
  "Lucy's Record Shop", "Mabuhay Gardens", "The Masque",
  "The Masquerade", "Max's Kansas City", "The Middle East",
  "The Milestone", "Mr. Roboto Project", "Mudd Club", "Neo",
  "New Moon", "O'Banion's", "O'Cayz Corral", "The Old Bar",
  "Prince of Wales Hotel", "The Rathskeller",
  "Raul's", "Rodney Bingenheimer's English Disco",
  "St. Stephen and the Incarnation Episcopal Church",
  "Self Help Graphics & Art", "The Smell", "SO36",
  "Sound of Music", "Speak in Tongues", "Starwood",
  "Tier 3", "The Tote Hotel", "Triple Rock Social Club",
  "Valencia Tool & Die", "Warm Water Cove",
];

const CITIES = [
  "Berlin", "Berlin", "Hamburg", "München", "Bayern", "Köln",
  "Frankfurt am Main", "Düsseldorf", "Leipzig", "Stuttgart", "Dortmund",
  "Essen", "Dresden", "Nürnberg", "Hannover", "Duisburg", "Bochum",
  "Wuppertal", "Bielefeld", "Bonn", "Mannheim", "Karlsruhe", "Münster",
  "Augsburg", "Wiesbaden", "Gelsenkirchen", "Aachen", "Braunschweig", "Kiel",
];

const FIRST_NAMES = ["Abdelkader", "Abubakar", "Adrian", "Akissi",
  "Aleksandar", "Aleksander", "Alex", "Alifazea Amanda", "Amal", "Amlie",
  "Ana Maria", "Anahera", "Anahit", "Anna", "Antonella", "Antoni", "Aroha",
  "Atarangi", "Avery", "Ayaan", "Bautista", "Blake", "Casey", "Catalina",
  "Celine", "Chandra", "Charlie", "Cheikh", "Chia-hao", "Dakota", "Dejan",
  "Do-yeon", "Dragan", "Drew", "Dylan, Lucas", "Edna", "Egshiglen", "Elika",
  "Ema", "Eman", "Emerson", "Emilia", "Esther", "Fatima", "Filomena", "Finley",
  "Franciszek", "Googoosh", "Goran", "Ha-joon", "Halima", "Hamza", "Hanan",
  "Harper", "Hawa", "Himari", "Hiro", "Hoang", "Huda", "Ignacy", "Igor",
  "Ilija", "Ioane", "Jakub", "Jamie", "Jan", "Jordan", "Julie", "Kirollos",
  "Kotoha", "Laura", "Laxmi", "Leon", "Liam", "Lian", "Ling", "Louis", "Maia",
  "Malak", "Manaia", "Manua", "Mara del Carmen", "Marama", "Marcia", "Mariame",
  "Maryam", "Matteo", "Maui", "Mei", "Mersana", "Meryem", "Mikayel",
  "Mikoaj", "Moana", "Mona", "Morgan", "Nadia", "Natlie", "Nikodem", "Nikola",
  "Noah", "Nurhayati", "Odalys", "Petar", "Quinn", "Rahel", "Rajesh", "Rangi",
  "Rangimarie", "Reese", "Riley", "Rowan", "Rozlie", "Sawyer", "Si-woo",
  "Siti Aminah", "Skyler", "Sofie", "Sombun", "Stanis?aw", "Stefan",
  "Sumarni", "Tamar", "Tamatoa", "Tapuarii", "Taylor", "Tehei", "Teiki",
  "Teiva", "Teva", "Thiago", "Tui", "Turki", "Umar", "Viktorie", "Wassim",
  "Yan", "Zahra", "Zainab", "Zakaria", "Zoran"];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateShowTitle(): string {
  return `${pickRandom(VENUENAMES)}, ${pickRandom(CITIES)}`;
}

export function generatePersonName(): string {
  return `${pickRandom(FIRST_NAMES)}`;
}
