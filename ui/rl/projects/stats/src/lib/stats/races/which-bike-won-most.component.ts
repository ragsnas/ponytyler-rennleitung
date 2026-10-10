import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StatisticsService, WhichBikeWonMost } from "../../../../../backend-api/src/lib/statistics.service";
import { bikeWonLabel } from "../../../../../backend-api/src/lib/bike-won";
import { map, Observable, tap } from "rxjs";

export type WhichBikeWonMostUi = {
  timesWon: number;
  bikeWon: string;
}

@Component({
    selector: "lib-songs",
    templateUrl: "./which-bike-won-most.component.html",
    styleUrls: ["./which-bike-won-most.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class WhichBikeWonMostComponent implements OnInit {
  whichBikeWonMostComponent$: Observable<WhichBikeWonMostUi[]> | undefined;

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
            bikeWon: bikeWonLabel(bikeWonMostStat.bikeWon),
            timesWon: bikeWonMostStat.timesWon,
          })),
        ),
        tap(data => console.log(`data stats loaded:`, data))
      );
  }
}
