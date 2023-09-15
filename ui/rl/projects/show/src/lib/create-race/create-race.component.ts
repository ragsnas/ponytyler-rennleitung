import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RaceService } from '../../../../backend-api/src/lib/race.service';
import { SongService } from 'projects/song/src/public-api';

@Component({
  selector: 'lib-create-race',
  templateUrl: './create-race.component.html',
  styleUrls: ['./create-race.component.css']
})
export class CreateRaceComponent implements OnInit {
  
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    person1: new FormControl(''),
    song1Id: new FormControl(''),
    person2: new FormControl(''),
    song2Id: new FormControl(''),
    orderNumber: new FormControl(''),
  });
  
  constructor(private raceService: RaceService, private songService: SongService) { }
  
  ngOnInit(): void {
  }

  createRace() {
    throw new Error('Method not implemented.');
  }

}
