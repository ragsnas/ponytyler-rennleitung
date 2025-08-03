import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StatisticsService, WhichBikeWonMost } from "../../../../../backend-api/src/lib/statistics.service";
import { map, Observable, tap } from "rxjs";

export type WhichBikeWonMostUi = {
  timesWon: number;
  bikeWon: string;
}

@Component({
  selector: "lib-songs",
  templateUrl: "./which-bike-won-most.component.html",
  styleUrls: ["./which-bike-won-most.component.scss"],
})
export class WhichBikeWonMostComponent implements OnInit {
  whichBikeWonMostComponent$: Observable<WhichBikeWonMostUi[]> | undefined;

  bikeWonMapping: Map<number, string> = new Map(
    [
      [0, "Not Raced"],
      [1, "White Bike Won"],
      [2, "Black Bike Won"],
      [3, "Both Songs Played"],
    ]);

  constructor(
    private route: ActivatedRoute,
    private statisticsService: StatisticsService) {
  }

  ngOnInit(): void {
    console.log(`WhichBikeWonMostComponent init`);
    this.whichBikeWonMostComponent$ = this.statisticsService.whichBikeWonMost()
      .pipe(
        map((bikeWonMostStats: WhichBikeWonMost[]) =>
          bikeWonMostStats.map((bikeWonMostStat: WhichBikeWonMost) => ({
            bikeWon: this.bikeWonMapping.get(bikeWonMostStat.bikeWon) || "",
            timesWon: bikeWonMostStat.timesWon,
          })),
        ),
        tap(data => console.log(`data stats loaded:`, data))
      );
  }
}
