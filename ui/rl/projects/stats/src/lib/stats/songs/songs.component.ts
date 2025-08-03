import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StatisticsService, StatSong } from "../../../../../backend-api/src/lib/statistics.service";
import { Observable } from "rxjs";


export enum SongStatType {
  MOST_PLAYED_SONGS = "most-played-songs",
  MOST_WISHED_SONGS = "most-wished-songs",
  NEVER_WISHED_SONGS = "never-wished-songs",
}

@Component({
  selector: "lib-songs",
  templateUrl: "./songs.component.html",
  styleUrls: ["./songs.component.scss"],
})
export class SongsComponent implements OnInit {
  songStatType: SongStatType | undefined;
  songs$: Observable<StatSong[]> | undefined;

  constructor(
    private route: ActivatedRoute,
    private statisticsService: StatisticsService) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.songStatType = params.get('songStatType') as SongStatType
      if (this.songStatType === SongStatType.MOST_PLAYED_SONGS) {
        this.songs$ = this.statisticsService.mostPlayedSongs();
        console.log(`mostPlayedSongs!`);
        this.songs$.subscribe(songs => console.log(`mostPlayedSongs:`, songs));
      } else if (this.songStatType === SongStatType.MOST_WISHED_SONGS) {
        this.songs$ = this.statisticsService.mostWishedSongs();
        console.log(`mostWishedSongs!`);
      } else if (this.songStatType === SongStatType.NEVER_WISHED_SONGS) {
        this.songs$ = this.statisticsService.neverWishedSongs();
        console.log(`neverWishedSongs!`);
        this.songs$.subscribe(songs => console.log(`neverWishedSongs:`, songs));
      }
    });
  }


}
