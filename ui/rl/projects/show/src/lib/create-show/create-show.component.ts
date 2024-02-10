import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ShowService} from 'projects/backend-api/src/lib/show.service';
import {MatSnackBar} from "@angular/material/snack-bar";

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
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
  }

  createShow() {
    const {name, date, time}: { name: string, date: Date, time: string } = this.form.getRawValue();
    console.log(`date: ${date}, time: ${time}`);
    console.log(`hours: ${time.substring(0, 2)}, minutes: ${time.substring(3)}`);
    date.setHours(Number(time.substring(0, 2)));
    date.setMinutes(Number(time.substring(3)));
    console.log(`altered date with time set: ${date}`);
    this.showService.createShow({name, date, active: true}).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully Created Show ${name}`, 'OK', {panelClass: 'success'})
          .afterDismissed()
          .subscribe(() => {
            this.router.navigate(['..', result.id], {relativeTo: this.route});
          });
      },
      error: (error) => {
        this.snackBar.open(`Error during Creation Of Show: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        });
      },
    });
  }
}
