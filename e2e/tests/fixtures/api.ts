import { APIRequestContext, expect } from '@playwright/test';
import { uniqueName } from './unique';

export const BACKEND_URL = 'http://localhost:3010';

export interface Show {
  id: number;
  name: string;
}

export interface Song {
  id: number;
  name: string;
  artist: string;
  selectable: boolean;
}

export interface Race {
  id: number;
  showId: number;
  orderNumber: number;
  person1: string | null;
  person2: string | null;
  song1Id: number | null;
  song2Id: number | null;
  raceState: string;
  bikeWon: number;
  raced: boolean;
}

export interface RaceOptions {
  person1?: string;
  person2?: string;
  song1?: Pick<Song, 'id'>;
  song2?: Pick<Song, 'id'>;
  /** Defaults to LISTED, which the backend adjusts to the riders and songs given. */
  raceState?: string;
}

/**
 * Seeds state through the backend REST API, so a spec can use the UI only
 * for the thing it actually tests. Everything created here is tracked and
 * removed again by {@link SeedingApi.cleanup}, which keeps specs re-runnable
 * on a warm stack. Names default to unique ones.
 */
export function createApi(request: APIRequestContext) {
  const shows: Show[] = [];
  const songs: Song[] = [];
  const races: Race[] = [];

  async function post<T>(path: string, data: object): Promise<T> {
    const response = await request.post(`${BACKEND_URL}/api/${path}`, { data });
    expect(response.status(), `POST /api/${path}`).toBe(201);
    return response.json();
  }

  async function patch<T>(path: string, data: object): Promise<T> {
    const response = await request.patch(`${BACKEND_URL}/api/${path}`, { data });
    expect(response.status(), `PATCH /api/${path}`).toBe(200);
    return response.json();
  }

  return {
    async createShow(options: { name?: string } = {}): Promise<Show> {
      const show = await post<Show>('show', { name: options.name ?? uniqueName('E2E Show') });
      shows.push(show);
      return show;
    },

    async createSong(options: { name?: string; artist?: string; selectable?: boolean } = {}): Promise<Song> {
      const song = await post<Song>('song', {
        name: options.name ?? uniqueName('E2E Song'),
        artist: options.artist ?? uniqueName('E2E Artist'),
        ...(options.selectable === undefined ? {} : { selectable: options.selectable }),
      });
      songs.push(song);
      return song;
    },

    /**
     * Registers a show that was created some other way (e.g. through the UI)
     * so cleanup deletes it too. Deleting a show also deletes its races.
     */
    adoptShow(id: number): void {
      shows.push({ id, name: '' });
    },

    /**
     * Creates a race at the end of the show's order. As with the create-race
     * form, the backend turns it into LISTED when both riders and both songs
     * are given and into WAITING_FOR_OPPONENT otherwise.
     */
    async createRace(show: Pick<Show, 'id'>, options: RaceOptions = {}): Promise<Race> {
      const race = await post<Race>('race', {
        showId: show.id,
        raceState: options.raceState ?? 'LISTED',
        ...(options.person1 === undefined ? {} : { person1: options.person1 }),
        ...(options.person2 === undefined ? {} : { person2: options.person2 }),
        ...(options.song1 ? { song1Id: options.song1.id } : {}),
        ...(options.song2 ? { song2Id: options.song2.id } : {}),
      });
      races.push(race);
      return race;
    },

    /** Records the result the way the app does: bike 1, 2 or 3 (both) won. */
    async setWinner(race: Pick<Race, 'id' | 'showId'>, bikeWon: 1 | 2 | 3): Promise<Race> {
      // The update endpoint always reconnects the race's show, so showId must be sent.
      return patch<Race>(`race/${race.id}`, {
        showId: race.showId,
        bikeWon,
        raceState: 'RACED',
        raced: true,
      });
    },

    /** Deletes what this helper created: races first, then shows, then songs. Already deleted entities are fine. */
    async cleanup(): Promise<void> {
      for (const [path, entities] of [
        ['race', races],
        ['show', shows],
        ['song', songs],
      ] as const) {
        for (const entity of entities.splice(0).reverse()) {
          const response = await request.delete(`${BACKEND_URL}/api/${path}/${entity.id}`);
          if (response.ok()) {
            continue;
          }
          // Deleting a missing entity fails (500 for a show), which is fine for
          // a test that already deleted its own data; anything else is not.
          const stillThere = await request.get(`${BACKEND_URL}/api/${path}/${entity.id}`);
          expect(await stillThere.text(), `DELETE /api/${path}/${entity.id} failed with ${response.status()}`).toBe('');
        }
      }
    },
  };
}

export type SeedingApi = ReturnType<typeof createApi>;
