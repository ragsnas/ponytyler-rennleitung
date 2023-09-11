import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-create-race',
  templateUrl: './create-race.component.html',
  styleUrls: ['./create-race.component.css']
})
export class CreateRaceComponent implements OnInit {

  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
  });


  constructor() { }

  ngOnInit(): void {
  }

}
