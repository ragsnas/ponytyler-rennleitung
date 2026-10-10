/** `Race.bikeWon` as stored by the backend (the MQTT broker uses the same numbering). */
export enum BikeWon {
  NOT_RACED = 0,
  BLACK = 1,
  WHITE = 2,
  BOTH = 3,
}

const BIKE_WON_LABELS: Record<BikeWon, string> = {
  [BikeWon.NOT_RACED]: 'Not Raced',
  [BikeWon.BLACK]: 'Black Bike Won',
  [BikeWon.WHITE]: 'White Bike Won',
  [BikeWon.BOTH]: 'Both Songs Played',
};

export function bikeWonLabel(bikeWon: number): string {
  return BIKE_WON_LABELS[bikeWon as BikeWon] ?? '';
}
