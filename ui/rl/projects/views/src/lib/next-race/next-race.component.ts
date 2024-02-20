import {Component} from '@angular/core';
import {Race, RaceService} from 'projects/backend-api/src/lib/race.service';
import {Observable} from "rxjs";

@Component({
  selector: 'lib-next-race',
  templateUrl: './next-race.component.html',
  styleUrls: ['./next-race.component.css']
})
export class NextRaceComponent {

  upcommingRace$: Observable<Race> = this.raceService.getUpcommingRace();

  constructor(private raceService: RaceService) { }
}
