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

  private cleanSongname(name: string): string {
    return name.replace("[PT]", "").replace("[PTHQ]", "").toLowerCase().trim();
  }

  private songToString(song: Song) {
    return `${song.artist} - ${song.name}`;
  }
}
