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
  deleted: boolean;
  origin: string;
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

  /**
   * PATCH, retried on a 500. Updating a show (or a race) into an active state
   * makes the backend list every other show (race) in an active state and
   * reset it, and the whole update fails if one of them is deleted by a
   * parallel test in between. The update is idempotent, so trying again is safe.
   */
  async function patch<T>(path: string, data: object): Promise<T> {
    let response = await request.patch(`${BACKEND_URL}/api/${path}`, { data });
    for (let attempt = 1; attempt < 4 && response.status() === 500; attempt++) {
      response = await request.patch(`${BACKEND_URL}/api/${path}`, { data });
    }
    expect(response.status(), `PATCH /api/${path}`).toBe(200);
    return response.json();
  }

  /**
   * Takes a show out of the live state. A live show listed a moment ago may be
   * deleted right now by the cleanup of the test that held the lock before
   * (the lock is released first), so a show that is gone is fine.
   */
  async function deactivate(show: { id: number }): Promise<void> {
    const send = () => request.patch(`${BACKEND_URL}/api/show/${show.id}`, { data: { active: false, showState: 'LISTED' } });
    let response = await send();
    for (let attempt = 1; attempt < 4 && response.status() === 500; attempt++) {
      response = await send(); // see `patch`: a 500 can come from a show deleted meanwhile
    }
    if (!response.ok()) {
      const stillThere = await request.get(`${BACKEND_URL}/api/show/${show.id}`);
      expect(await stillThere.text(), `PATCH /api/show/${show.id} failed with ${response.status()}`).toBe('');
    }
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
     * Registers every song of the artist for cleanup, for songs created some
     * other way (through the UI, a file or cloud sync) under a unique artist.
     */
    async adoptSongsByArtist(artist: string): Promise<Song[]> {
      const response = await request.get(`${BACKEND_URL}/api/song`);
      const all: Song[] = await response.json();
      const found = all.filter((song) => song.artist === artist);
      songs.push(...found);
      return found;
    },

    /**
     * Registers a show that was created some other way (e.g. through the UI)
     * so cleanup deletes it too. Deleting a show also deletes its races.
     */
    adoptShow(id: number): void {
      shows.push({ id, name: '' });
    },

    /** A LISTED race with both riders and both songs (each unique), ready to be raced. */
    async createCompleteRace(show: Pick<Show, 'id'>): Promise<Race> {
      return this.createRace(show, {
        person1: uniqueName('Rider Black'),
        song1: await this.createSong(),
        person2: uniqueName('Rider White'),
        song2: await this.createSong(),
      });
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

    async getShow(show: Pick<Show, 'id'>): Promise<Show & { active: boolean; showState: string }> {
      return (await request.get(`${BACKEND_URL}/api/show/${show.id}`)).json();
    },

    async getRace(race: Pick<Race, 'id'>): Promise<Race> {
      return (await request.get(`${BACKEND_URL}/api/race/${race.id}`)).json();
    },

    /**
     * Makes the show THE live show, as "Start Show" does (active, BEFORE_RACE by
     * default). Every other live show is deactivated first: the backend only
     * resets their state to LISTED and leaves them `active`, which would make
     * the "current show" ambiguous. Global state, so only hold it with the
     * `exclusiveRaceState` fixture.
     */
    async startShow(show: Pick<Show, 'id'>, showState: string = 'BEFORE_RACE'): Promise<Show> {
      const live: Show[] = await (await request.get(`${BACKEND_URL}/api/show/current-shows`)).json();
      for (const other of live.filter((candidate) => candidate.id !== show.id)) {
        await deactivate(other);
      }
      return patch<Show>(`show/${show.id}`, { active: true, showState });
    },

    /** Deactivates every live show, so there is no current show. Global state: see startShow. */
    async stopAllShows(): Promise<void> {
      const live: Show[] = await (await request.get(`${BACKEND_URL}/api/show/current-shows`)).json();
      for (const show of live) {
        await deactivate(show);
      }
    },

    async setShowState(show: Pick<Show, 'id'>, showState: string): Promise<Show> {
      return patch<Show>(`show/${show.id}`, { showState });
    },

    /**
     * Changes the race's state and sends its stored riders and songs along, as
     * the UI does: the backend decides between LISTED and WAITING_FOR_OPPONENT
     * from the riders and songs in the request, not from the stored ones.
     */
    async setRaceState(race: Pick<Race, 'id'>, raceState: string): Promise<Race> {
      const { showId, person1, person2, song1Id, song2Id } = await this.getRace(race);
      return patch<Race>(`race/${race.id}`, {
        showId,
        person1,
        person2,
        ...(song1Id ? { song1Id } : {}),
        ...(song2Id ? { song2Id } : {}),
        raceState,
      });
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
