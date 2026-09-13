import { Component, OnInit } from "@angular/core";
import { BackendApiModule } from "projects/backend-api/src/public-api";
import { Race, RaceService } from "projects/backend-api/src/lib/race.service";
import { Show, ShowService } from "projects/backend-api/src/lib/show.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: 'lib-state-machine',
  standalone: true,
  imports: [BackendApiModule],
  templateUrl: 'state-machine.component.html'
})
export class StateMachineComponent implements OnInit {

  private currentRace: Race | undefined;
  private currentShow: Show | undefined;

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
