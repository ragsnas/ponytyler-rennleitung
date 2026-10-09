import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { Origin, SongService } from "../../prisma-api/song.service";
import { Song } from "@prisma/client";
import { firstValueFrom } from "rxjs";

const DEFAULT_SONGLIST_URL = "https://songlist.ponytyler.de/";
const HTTP_TIMEOUT_MS = 15000;

type CloudSong = { artist: string; title: string; status: string };

@Injectable()
export class SongSyncService {
  private readonly logger = new Logger(SongSyncService.name);
  private syncInProgress = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly songService: SongService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    if (this.syncInProgress) {
      this.logger.log("Song Sync already running, skipping scheduled run.");
      return;
    }
    try {
      await this.runSync();
    } catch (error) {
      this.logger.error(`Scheduled Song Sync failed: ${error}`);
    }
  }

  /**
   * Lets the frontend trigger the same sync the cron job runs, on demand.
   * Throws instead of queueing so a second click while one is already
   * running (from the cron job or a previous trigger) surfaces immediately
   * rather than silently piling up. Failures (cloud unreachable, database
   * errors) are rethrown so the caller sees them.
   */
  async triggerSync(): Promise<void> {
    if (this.syncInProgress) {
      throw new ConflictException("Song Sync is already running.");
    }
    await this.runSync();
  }

  private async runSync() {
    this.syncInProgress = true;
    try {
      this.logger.log("Running Song Sync Cron-Job.");
      const response = await firstValueFrom(
        this.httpService.get<CloudSong[]>(
          `${this.songlistUrl()}api/index.php`,
          { timeout: HTTP_TIMEOUT_MS },
        ),
      );
      const localSongs = await this.songService.songs({});

      // Index the local songs once instead of re-normalising every name for
      // every cloud song; new songs are added to it so a song that appears
      // twice in the cloud list is only created once.
      const localSongsByName = new Map<string, Song | undefined>(
        localSongs.map((song: Song) => [
          this.cleanSongname(this.songToString(song)),
          song,
        ]),
      );

      const songsToCreate: Parameters<SongService["createManySongs"]>[0] = [];
      const idsToMakeSelectable: number[] = [];
      const idsToMakeUnselectable: number[] = [];

      for (const cloudSong of response.data) {
        const key = this.cleanSongname(
          `${cloudSong.artist} - ${cloudSong.title}`,
        );
        const selectable = cloudSong.status === "listed";
        const localSong = localSongsByName.get(key);
        if (!localSong) {
          songsToCreate.push({
            name: cloudSong.title,
            artist: cloudSong.artist,
            selectable,
            deleted: false,
            origin: Origin.FROM_CLOUD_SYNC,
          });
          localSongsByName.set(key, {
            selectable,
          } as Song);
        } else if (localSong.selectable !== selectable) {
          (selectable ? idsToMakeSelectable : idsToMakeUnselectable).push(
            localSong.id,
          );
          localSong.selectable = selectable;
        }
      }

      if (songsToCreate.length > 0) {
        await this.songService.createManySongs(songsToCreate);
      }
      await this.updateSelectable(idsToMakeSelectable, true);
      await this.updateSelectable(idsToMakeUnselectable, false);

      this.logger.log(
        `Song Sync finished: ${songsToCreate.length} created, ${
          idsToMakeSelectable.length + idsToMakeUnselectable.length
        } updated.`,
      );
    } finally {
      this.syncInProgress = false;
    }
  }

  private async updateSelectable(ids: number[], selectable: boolean) {
    if (ids.length === 0) {
      return;
    }
    await this.songService.updateManySongs({
      where: { id: { in: ids } },
      data: { selectable },
    });
  }

  private songlistUrl(): string {
    const url =
      this.configService.get<string>("SONGLIST_URL") ?? DEFAULT_SONGLIST_URL;
    return url.endsWith("/") ? url : `${url}/`;
  }

  /**
   * Sets `selectable` to match presence on the cloud songlist: true for
   * local songs found there, false for every other local song.
   */
  async updateSelectability(): Promise<void> {
    const songlistPage = await firstValueFrom(
      this.httpService.get(this.songlistUrl(), {
        responseType: "text",
        timeout: HTTP_TIMEOUT_MS,
      }),
    );
    const localSongs = await this.songService.songs({});

    const cloudSongs = this.parseSonglistPage(songlistPage.data);
    const cloudSongNames = new Set(
      cloudSongs.map((song) =>
        this.cleanSongname(`${song.artist} - ${song.title}`),
      ),
    );

    const idsToMakeSelectable: number[] = [];
    const idsToMakeUnselectable: number[] = [];
    for (const localSong of localSongs) {
      const shouldBeSelectable = cloudSongNames.has(
        this.cleanSongname(this.songToString(localSong)),
      );
      if (localSong.selectable !== shouldBeSelectable) {
        (shouldBeSelectable ? idsToMakeSelectable : idsToMakeUnselectable).push(
          localSong.id,
        );
      }
    }

    await this.updateSelectable(idsToMakeSelectable, true);
    await this.updateSelectable(idsToMakeUnselectable, false);
  }

  private cleanSongname(name: string): string {
    return name
      .replaceAll("[PT]", "")
      .replaceAll("[PTHQ]", "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();
  }

  /**
   * The public songlist is rendered HTML (no JSON API), with each artist
   * as `<div class='content'><span class='artist-name'>...</span>...
   * <div class='song-list'><div class='song'>...</div>...</div></div>`.
   */
  private parseSonglistPage(html: string): { artist: string; title: string }[] {
    const songs: { artist: string; title: string }[] = [];
    const artistBlocks = html.split("<div class='content'>").slice(1);

    for (const block of artistBlocks) {
      const artistMatch = block.match(
        /<span class='artist-name'>(.*?)<\/span>/,
      );
      if (!artistMatch) {
        continue;
      }
      const artist = this.decodeHtmlEntities(artistMatch[1]);

      for (const songMatch of block.matchAll(
        /<div class='song'>(.*?)<\/div>/g,
      )) {
        songs.push({ artist, title: this.decodeHtmlEntities(songMatch[1]) });
      }
    }

    return songs;
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  private songToString(song: Song) {
    return `${song.artist} - ${song.name}`;
  }
}
