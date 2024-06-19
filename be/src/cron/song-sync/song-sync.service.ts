import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { Origin, SongService } from "../../prisma-api/song.service";
import { Song } from "@prisma/client";
import { firstValueFrom } from "rxjs";

@Injectable()
export class SongSyncService {
  private readonly logger = new Logger(SongSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly songService: SongService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
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
          this.logger.debug("Need to create Song:" + JSON.stringify(song));
          this.songService
            .createSong({
              name: song.title,
              artist: song.artist,
              selectable: true,
              deleted: false,
              origin: Origin.FROM_CLOUD_SYNC,
            })
            .then((song: Song) => {
              this.logger.debug("Song Created:" + JSON.stringify(song));
            });
        }
      });
    }
  }

  private cleanSongname(name: string): string {
    return name.replace("[PT]", "").replace("[PTHQ]", "").toLowerCase().trim();
  }

  private songToString(song: Song) {
    return `${song.artist} - ${song.name}`;
  }
}
