import { BikeWon, bikeWonLabel } from './bike-won';

describe('bikeWonLabel', () => {
  it('uses the numbering the backend stores: 1 = black bike, 2 = white bike', () => {
    expect(BikeWon.BLACK).toBe(1);
    expect(BikeWon.WHITE).toBe(2);
    expect(bikeWonLabel(BikeWon.BLACK)).toBe('Black Bike Won');
    expect(bikeWonLabel(BikeWon.WHITE)).toBe('White Bike Won');
  });

  it('labels a tie and a race that did not happen', () => {
    expect(bikeWonLabel(BikeWon.BOTH)).toBe('Both Songs Played');
    expect(bikeWonLabel(BikeWon.NOT_RACED)).toBe('Not Raced');
  });

  it('is empty for an unknown value', () => {
    expect(bikeWonLabel(7)).toBe('');
  });
});
