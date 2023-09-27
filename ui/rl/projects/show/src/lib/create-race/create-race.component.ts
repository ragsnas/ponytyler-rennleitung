import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Song, SongService } from 'projects/song/src/public-api';
import { RaceService } from '../../../../backend-api/src/lib/race.service';

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
  
  constructor(private raceService: RaceService, private songService: SongService, private route: ActivatedRoute, private router: Router) { }
  
  ngOnInit(): void {
  }

  createRace() {
    this.raceService.createRace({
      ...this.form.getRawValue(),
      showId: this.route.snapshot.paramMap.get('showId')
    }).subscribe({
      next: (result) => {
        console.log(`It worked:`, result);
        this.router.navigate(['..'], {relativeTo: this.route});
      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      }
    });
  }

}
