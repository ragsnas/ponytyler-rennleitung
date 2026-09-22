const ADJECTIVES = [
  "Blazing", "Electric", "Wild", "Golden", "Midnight", "Crimson",
  "Silver", "Thunderous", "Neon", "Roaring", "Turbo", "Rusty",
  "Sparkling", "Fearless", "Screaming", "Iron", "Velvet", "Shadowy",
  "Radiant", "Feral",
];

const NOUNS = [
  "Falcons", "Comets", "Panthers", "Rockets", "Wolves", "Titans",
  "Vipers", "Hurricanes", "Chargers", "Renegades", "Phantoms",
  "Mavericks", "Bandits", "Cyclones", "Outlaws", "Stallions",
  "Raptors", "Nomads", "Legends", "Pioneers",
];

const FIRST_NAMES = [
  "Abubakar", "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley",
  "Jamie", "Skyler", "Quinn", "Avery", "Rowan", "Emerson", "Finley",
  "Harper", "Dakota", "Reese", "Sawyer", "Blake", "Charlie", "Drew",
];

const LAST_NAMES = [
  "Nakamura", "Connors", "Silva", "Kowalski", "Fischer", "Novak",
  "Andersson", "Moreau", "Ivanov", "Haddad", "Kimura", "Larsen",
  "Costa", "Weber", "Dubois", "Berger", "Okafor", "Santos",
  "Petrov", "Lindgren",
];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateShowTitle(): string {
  return `The ${pickRandom(ADJECTIVES)} ${pickRandom(NOUNS)}`;
}

export function generatePersonName(): string {
  return `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
}
