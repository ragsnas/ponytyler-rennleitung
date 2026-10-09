import { APIRequestContext, expect } from '@playwright/test';

/** The songlist stub (e2e/songlist-stub), published on host port 8090 in the e2e stack. */
export const SONGLIST_URL = 'http://localhost:8090';

export interface CloudSong {
  artist: string;
  title: string;
  status: 'listed' | 'unlisted';
}

/**
 * Controls what the "cloud" songlist serves to the backend. Replacing the list
 * is global state that every cloud sync reads, so use it only through the
 * `songlist` fixture (which serializes users and restores the default list)
 * and only in a *.global.spec.ts.
 */
export function createSonglist(request: APIRequestContext) {
  return {
    async set(songs: CloudSong[]): Promise<void> {
      const response = await request.put(`${SONGLIST_URL}/__admin/songs`, { data: songs });
      expect(response.status(), 'PUT /__admin/songs').toBe(204);
    },

    async reset(): Promise<void> {
      const response = await request.delete(`${SONGLIST_URL}/__admin/songs`);
      expect(response.status(), 'DELETE /__admin/songs').toBe(204);
    },
  };
}

export type Songlist = ReturnType<typeof createSonglist>;
