import { Component, OnInit } from "@angular/core";
import { BackendApiModule } from "projects/backend-api/src/public-api";
import { Race, RaceService, RaceState } from "projects/backend-api/src/lib/race.service";
import { Show, ShowService, ShowState } from "projects/backend-api/src/lib/show.service";
import { firstValueFrom } from "rxjs";
import { NgIf } from "@angular/common";

@Component({
  selector: 'lib-state-machine',
  templateUrl: 'state-machine.component.html'
})
export class StateMachineComponent implements OnInit {

  public currentRace: Race | undefined;
  public currentRaceState: RaceState | undefined;
  public currentShow: Show | undefined;
  public currentShowState: ShowState | undefined;

  constructor(
    private raceService: RaceService,
    private showService: ShowService
    ) {
  }

  ngOnInit(): void {
    this.getCurrentShowAndRace();
    // @todo: load current Show, ShowState, Race and RaceState
    // @todo: Listen to ShowState and RaceState Changes via mqtt
  }

  async getCurrentShowAndRace() {
    this.currentShow = await firstValueFrom(this.showService.getCurrentShow());
    this.currentRace = await  firstValueFrom(this.raceService.getCurrentRace());
  }
}
