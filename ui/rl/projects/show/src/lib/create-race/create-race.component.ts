import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RaceService } from '../../../../backend-api/src/lib/race.service';
import { Song, SongService } from 'projects/song/src/public-api';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'lib-create-race',
  templateUrl: './create-race.component.html',
  styleUrls: ['./create-race.component.css']
})
export class CreateRaceComponent implements OnInit {
  
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    person1: new FormControl(''),
    song1: new FormControl<Song|undefined>(undefined),
    person2: new FormControl(''),
    song2: new FormControl<Song|undefined>(undefined),
    orderNumber: new FormControl(''),
  });
  
  constructor(private raceService: RaceService, private songService: SongService, private route: ActivatedRoute) { }
  
  ngOnInit(): void {
  }

  createRace() {
    this.raceService.createRace({
      ...this.form.getRawValue(),
      showId: this.route.snapshot.paramMap.get('showId')
    }).subscribe({
      next: (result) => {
        console.log(`It worked:`, result);
        
      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      }
    });
  }

}
