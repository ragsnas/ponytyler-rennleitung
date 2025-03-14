import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Show, ShowService} from 'projects/backend-api/src/lib/show.service';
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'lib-edit-show',
  templateUrl: './edit-show.component.html',
  styleUrls: ['./edit-show.component.scss'],
})
export class EditShowComponent implements OnInit {
  public form: FormGroup = new FormGroup({
    name: new FormControl('', {validators: [Validators.required]}),
    date: new FormControl(new Date()),
    time: new FormControl('20:00', {validators: [Validators.required]}),
    duration: new FormControl('120', {validators: [Validators.required]})
  });

  public show: Show | undefined;
  public showId: string | undefined;

  constructor(
    private showService: ShowService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.showId = this.route.snapshot.paramMap.get('showId') || undefined;
    if (this.showId) {
      this.showService.getShow(this.showId).subscribe((show: Show) => {
        console.log(`\nreceived Show:`, show);
        this.show = show;
        this.form.patchValue(show);
        const showDate = new Date(show.date);
        const showTime = showDate.toTimeString().substring(0,5);
        console.log(`\npatching time:`, `${showTime}`);
        this.form.controls['time'].patchValue(`${showTime}`);
        });
    }
  }

  updateShow() {
    const {
      name,
      date,
      time,
      duration
    }: { name: string, date: Date, time: string, duration: string } = this.form.getRawValue();
    console.log(`date: ${date}, time: ${time}`);
    console.log(`hours: ${time.substring(0, 2)}, minutes: ${time.substring(3)}`);
    const newDate = new Date(date);
    newDate.setHours(Number(time.substring(0, 2)));
    newDate.setMinutes(Number(time.substring(3)));

    this.showService.updateShow({
      ...this.show,
      name,
      date: newDate,
      duration: Number(duration) || 0,
      active: true,
      finished: this.show?.finished || false,
    }).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully Updated Show ${name}`, 'OK', {duration: 200, panelClass: 'success'})
          .afterDismissed()
          .subscribe(() => {
            this.router.navigate(['..'], {relativeTo: this.route});
          });
      },
      error: (error) => {
        this.snackBar.open(`Error during Update Of Show: ${JSON.stringify(error)}`, 'OK', {
          duration: 10000, panelClass: 'error'
        });
      },
    });
  }

  setDuration(duration: number): void {
    this.form.controls['duration'].patchValue(duration.toString());
  }

}
