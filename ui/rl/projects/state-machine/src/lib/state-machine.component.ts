import { Component, OnInit } from "@angular/core";
import { BackendApiModule } from "projects/backend-api/src/public-api";
import { RaceService } from 'projects/backend-api/src/lib/race.service';
import { ShowService } from 'projects/backend-api/src/lib/show.service';

@Component({
  selector: 'lib-state-machine',
  standalone: true,
  imports: [BackendApiModule],
  templateUrl: 'state-machine.component.html'
})
export class StateMachineComponent implements OnInit {

  constructor(
    private raceService: RaceService,
    private showService: ShowService
    ) {
  }

  ngOnInit(): void {
    // @todo: load current Show, ShowState, Race and RaceState
    // @todo: Listen to ShowState and RaceState Changes via mqtt
  }

  getCurrentShowAndRace() {
    let currentShow = this.showService.getCurrentShow();
    let currentRace = this.raceService.getCurrentRace();
  }
}
