import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowService } from 'projects/backend-api/src/lib/show.service';

@Component({
  selector: 'lib-create-show',
  templateUrl: './create-show.component.html',
  styleUrls: ['./create-show.component.css'],
})
export class CreateShowComponent {
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
    date: new FormControl(new Date()),
    time: new FormControl(''),
  });

  constructor(
    private showService: ShowService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  createShow() {
    const { name, date, time }: {name: string, date: Date, time: string} = this.form.getRawValue();
    console.log(`date: ${date}, time: ${time}`);
    console.log(`hours: ${time.substring(0, 2)}, minutes: ${time.substring(3)}`);
    date.setHours(Number(time.substring(0, 2)));
    date.setMinutes(Number(time.substring(3)));
    console.log(`altered date with time set: ${date}`);
    this.showService.createShow({ name, date }).subscribe({
      next: (result) => {
        console.log(`It worked:`, result);
        this.router.navigate(['..', result.id], { relativeTo: this.route });
      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      },
    });
  }
}
