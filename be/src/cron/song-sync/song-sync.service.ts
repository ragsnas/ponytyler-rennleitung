import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { Origin, SongService } from "../../prisma-api/song.service";
import { Song } from "@prisma/client";
import { firstValueFrom } from "rxjs";

@Injectable()
export class SongSyncService {
  private readonly logger = new Logger(SongSyncService.name);
  private syncInProgress = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly songService: SongService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    if (this.syncInProgress) {
      this.logger.log("Song Sync already running, skipping scheduled run.");
      return;
    }
    await this.runSync();
  }

  /**
   * Lets the frontend trigger the same sync the cron job runs, on demand.
   * Throws instead of queueing so a second click while one is already
   * running (from the cron job or a previous trigger) surfaces immediately
   * rather than silently piling up.
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
      let songsFromCloud = undefined;
      try {
        songsFromCloud = await firstValueFrom(
          this.httpService.get("https://songlist.ponytyler.de/api/index.php"),
        );
      } catch (e) {
        this.logger.error(`could not receive songs from cloud: `, e);
      }
      const localSongs = await this.songService.songs({});

      if (songsFromCloud && localSongs) {
        songsFromCloud.data.forEach((song) => {
          const fullCloudSongName = `${song.artist} - ${song.title}`;

          if (
            !localSongs.some(
              (localSong: Song) =>
                this.cleanSongname(this.songToString(localSong)) ===
                this.cleanSongname(fullCloudSongName),
            )
          ) {
            this.logger.log("Need to create Song:" + JSON.stringify(song));
            this.songService
              .createSong({
                name: song.title,
                artist: song.artist,
                selectable: true,
                deleted: false,
                origin: Origin.FROM_CLOUD_SYNC,
              })
              .then((song: Song) => {
                this.logger.log("Song Created:" + JSON.stringify(song));
              });
          }
        });
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sets `selectable` to match presence on the cloud songlist: true for
   * local songs found there, false for every other local song.
   */
  async updateSelectability(): Promise<void> {
    const songlistPage = await firstValueFrom(
      this.httpService.get("https://songlist.ponytyler.de/", {
        responseType: "text",
      }),
    );
    const localSongs = await this.songService.songs({});

    const cloudSongs = this.parseSonglistPage(songlistPage.data);
    const cloudSongNames = new Set(
      cloudSongs.map((song) =>
        this.cleanSongname(`${song.artist} - ${song.title}`),
      ),
    );

    await Promise.all(
      localSongs
        .map((localSong: Song) => ({
          localSong,
          shouldBeSelectable: cloudSongNames.has(
            this.cleanSongname(this.songToString(localSong)),
          ),
        }))
        .filter(
          ({ localSong, shouldBeSelectable }) =>
            localSong.selectable !== shouldBeSelectable,
        )
        .map(({ localSong, shouldBeSelectable }) =>
          this.songService.updateSong({
            where: { id: localSong.id },
            data: { selectable: shouldBeSelectable },
          }),
        ),
    );
  }

  private cleanSongname(name: string): string {
    return name.replace("[PT]", "").replace("[PTHQ]", "").toLowerCase().trim();
  }

  /**
   * The public songlist is rendered HTML (no JSON API), with each artist
   * as `<div class='content'><span class='artist-name'>...</span>...
   * <div class='song-list'><div class='song'>...</div>...</div></div>`.
   */
  private parseSonglistPage(
    html: string,
  ): { artist: string; title: string }[] {
    const songs: { artist: string; title: string }[] = [];
    const artistBlocks = html.split("<div class='content'>").slice(1);

    for (const block of artistBlocks) {
      const artistMatch = block.match(/<span class='artist-name'>(.*?)<\/span>/);
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
