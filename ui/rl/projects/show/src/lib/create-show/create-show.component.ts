import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ShowService } from 'projects/backend-api/src/lib/show.service';

@Component({
  selector: 'lib-create-show',
  templateUrl: './create-show.component.html',
  styleUrls: ['./create-show.component.css'],
})
export class CreateShowComponent {
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
  });

  constructor(private showService: ShowService) {

  }

  createShow() {
      this.showService.createShow(this.form.getRawValue());
  }
}
