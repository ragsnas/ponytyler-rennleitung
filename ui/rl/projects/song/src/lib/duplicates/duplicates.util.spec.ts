import { Origin, Song } from 'projects/backend-api/src/lib/song.service';
import { filterDuplicates, findNearestNeighbours } from './duplicates.util';

const song = (id: number, artist: string, name: string): Song => ({
  id, artist, name, deleted: false, selectable: true, origin: Origin.FROM_FILE_SYNC,
});

describe('duplicates.util', () => {
  describe('findNearestNeighbours', () => {
    it('returns an empty list for fewer than two songs', () => {
      expect(findNearestNeighbours([])).toEqual([]);
      expect(findNearestNeighbours([song(1, 'A', 'x')])).toEqual([]);
    });

    it('pairs every song with its closest other song and the edit distance', () => {
      const songs = [
        song(1, 'Queen', 'Bohemian Rhapsody'),
        song(2, 'Queen', 'Bohemian Rhapsody '),
        song(3, 'ABBA', 'Waterloo'),
      ];

      const result = findNearestNeighbours(songs);

      expect(result.map(r => [r.song.id, r.duplicate.id])).toEqual([[1, 2], [2, 1], [3, 1]]);
      expect(result.map(r => r.distance).slice(0, 2)).toEqual([1, 1]);
      expect(result[2].distance).toBeGreaterThan(1);
    });

    it('never pairs a song with itself, even when titles are identical', () => {
      const result = findNearestNeighbours([song(1, 'A', 'x'), song(2, 'A', 'x')]);

      expect(result.map(r => [r.song.id, r.duplicate.id, r.distance])).toEqual([[1, 2, 0], [2, 1, 0]]);
    });
  });

  describe('filterDuplicates', () => {
    const songs = [
      song(1, 'Queen', 'Bohemian Rhapsody'),
      song(2, 'Queen', 'Bohemian Rhapsody '),
      song(3, 'ABBA', 'Waterloo'),
    ];
    const neighbours = findNearestNeighbours(songs);

    it('lists each duplicate pair only once', () => {
      const result = filterDuplicates(neighbours, 1);

      expect(result.map(r => [r.id, r.duplicate.id])).toEqual([[1, 2]]);
    });

    it('is empty below the smallest distance', () => {
      expect(filterDuplicates(neighbours, 0)).toEqual([]);
    });

    it('includes more pairs for a larger threshold and sorts by distance', () => {
      const result = filterDuplicates(neighbours, 100);

      expect(result.length).toBe(2);
      expect(result[0].distance).toBeLessThanOrEqual(result[1].distance);
    });
  });
});
