import { distance } from 'fastest-levenshtein';
import { Song } from 'projects/backend-api/src/lib/song.service';

export interface SongWithDuplicateMeta extends Song {
  duplicate: Song
  distance: number
}

export interface SongNeighbour {
  song: Song
  duplicate: Song
  distance: number
}

const fullTitle = (song: Song): string => `${song.artist} - ${song.name}`;

/**
 * Pairs every song with its closest other song. O(n²) in the number of songs,
 * so call it once per song list, not once per threshold change.
 */
export function findNearestNeighbours(songs: Song[]): SongNeighbour[] {
  const titles = songs.map(fullTitle);
  const neighbours: SongNeighbour[] = [];

  songs.forEach((song, index) => {
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    for (let other = 0; other < songs.length; other++) {
      if (other === index) {
        continue;
      }
      const current = distance(titles[index], titles[other]);
      if (current < nearestDistance) {
        nearestDistance = current;
        nearestIndex = other;
      }
    }
    if (nearestIndex >= 0) {
      neighbours.push({ song, duplicate: songs[nearestIndex], distance: nearestDistance });
    }
  });

  return neighbours;
}

/**
 * Applies the distance threshold to precomputed neighbours. A pair is listed
 * once: a song that is already shown as the duplicate of an earlier entry is skipped.
 */
export function filterDuplicates(neighbours: SongNeighbour[], maxDistance: number): SongWithDuplicateMeta[] {
  const shownAsDuplicate = new Set<number | undefined>();
  const result: SongWithDuplicateMeta[] = [];

  for (const { song, duplicate, distance: songDistance } of neighbours) {
    if (songDistance <= maxDistance && !shownAsDuplicate.has(song.id)) {
      shownAsDuplicate.add(duplicate.id);
      result.push({ ...song, duplicate, distance: songDistance });
    }
  }

  return result.sort((a, b) => a.distance - b.distance);
}
