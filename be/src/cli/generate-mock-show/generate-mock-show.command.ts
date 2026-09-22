import { Injectable, Logger } from "@nestjs/common";
import { Show, ShowState, Song } from "@prisma/client";
import { RaceService } from "../../prisma-api/race.service";
import { ShowService } from "../../prisma-api/show.service";
import { SongService } from "../../prisma-api/song.service";
import { SongSyncService } from "../../cron/song-sync/song-sync.service";
import { generatePersonName, generateShowTitle } from "./random-name.util";

const RACE_COUNT = 20;
const MAX_SHOW_TITLE_ATTEMPTS = 10;

@Injectable()
export class GenerateMockShowCommand {
  private readonly logger = new Logger(GenerateMockShowCommand.name);

  constructor(
    private readonly songSyncService: SongSyncService,
    private readonly songService: SongService,
    private readonly showService: ShowService,
    private readonly raceService: RaceService,
  ) {}

  async run(): Promise<void> {
    await this.syncSongs();

    const show = await this.createShowWithRandomTitle();
    this.logger.log(`Created show "${show.name}" (#${show.id})`);

    const songs = await this.songService.songs({
      where: { deleted: false, selectable: true },
    });
    if (songs.length < 2) {
      throw new Error(
        `Need at least 2 selectable songs to create races, found ${songs.length}.`,
      );
    }

    for (let i = 0; i < RACE_COUNT; i++) {
      const [song1, song2] = this.pickTwoDistinctSongs(songs);
      const [person1, person2] = this.pickTwoDistinctPersonNames();
      const race = await this.raceService.createRace({
        showId: show.id,
        person1,
        song1Id: song1.id,
        person2,
        song2Id: song2.id,
        // RaceService.createRace always recomputes orderNumber itself and
        // ignores this value; it's only here to satisfy the input type.
        orderNumber: 0,
      });
      this.logger.log(
        `Created race #${race.id}: ${race.person1} vs ${race.person2}`,
      );
    }

    this.logger.log(
      `Done: created show "${show.name}" with ${RACE_COUNT} races.`,
    );
  }

  private async syncSongs(): Promise<void> {
    try {
      await this.songSyncService.triggerSync();
    } catch (error) {
      this.logger.warn(
        `Song sync could not be triggered, continuing with existing songs: ${error}`,
      );
    }

    try {
      await this.songSyncService.updateSelectability();
    } catch (error) {
      this.logger.warn(`Updating song selectability failed: ${error}`);
    }
  }

  private async createShowWithRandomTitle(): Promise<Show> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_SHOW_TITLE_ATTEMPTS; attempt++) {
      const name = generateShowTitle();
      try {
        return await this.showService.createShow({
          name,
          date: new Date(),
          showState: ShowState.BEFORE_SHOW,
        });
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) {
          throw error;
        }
        lastError = error;
      }
    }
    this.logger.error("Last show title collision:", lastError);
    throw new Error(
      `Could not generate a unique show title after ${MAX_SHOW_TITLE_ATTEMPTS} attempts.`,
    );
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: unknown }).code === "P2002"
    );
  }

  private pickTwoDistinctSongs(songs: Song[]): [Song, Song] {
    const first = songs[Math.floor(Math.random() * songs.length)];
    let second = first;
    while (second.id === first.id) {
      second = songs[Math.floor(Math.random() * songs.length)];
    }
    return [first, second];
  }

  private pickTwoDistinctPersonNames(): [string, string] {
    const first = generatePersonName();
    let second = generatePersonName();
    while (second === first) {
      second = generatePersonName();
    }
    return [first, second];
  }
}
