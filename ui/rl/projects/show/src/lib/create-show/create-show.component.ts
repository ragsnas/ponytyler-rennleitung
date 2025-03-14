import { Component } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ShowService } from "projects/backend-api/src/lib/show.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ShiftRole } from "projects/backend-api/src/lib/shift.service";

@Component({
  selector: "lib-create-show",
  templateUrl: "./create-show.component.html",
  styleUrls: ["./create-show.component.scss"],
})
export class CreateShowComponent {
  public shiftsFormArray: FormArray<FormArray> = new FormArray<FormArray>([]);

  public form: FormGroup = new FormGroup({
    name: new FormControl("", { validators: [Validators.required] }),
    date: new FormControl(new Date()),
    time: new FormControl("20:00", { validators: [Validators.required] }),
    duration: new FormControl("120", { validators: [Validators.required] }),
    shifts: this.shiftsFormArray,
  });

  constructor(
    private showService: ShowService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
  }

  createShow() {
    const {
      name,
      date,
      time,
      duration,
    }: { name: string, date: Date, time: string, duration: string } = this.form.getRawValue();
    console.log(`date: ${date}, time: ${time}`);
    console.log(`hours: ${time.substring(0, 2)}, minutes: ${time.substring(3)}`);
    date.setHours(Number(time.substring(0, 2)));
    date.setMinutes(Number(time.substring(3)));

    console.log(`altered date with time set: ${date}`);

    this.showService.createShow({
      name,
      date,
      duration: Number(duration) || 0,
      active: true,
      finished: false,
    }).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully Created Show ${name}`, "OK", { panelClass: "success" })
          .afterDismissed()
          .subscribe(() => {
            this.router.navigate(["..", result.id], { relativeTo: this.route });
          });
      },
      error: (error) => {
        this.snackBar.open(`Error during Creation Of Show: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, panelClass: "error",
        });
      },
    });
  }

  setDuration(duration: number): void {
    this.form.controls["duration"].patchValue(duration.toString());
  }

  shiftFormControlsAsArray(): FormArray[] {
    return Object.values(this.shiftsFormArray.controls) as FormArray[];

  }

  addShift() {
    this.shiftsFormArray.push(
      new FormArray([
        new FormGroup({
          roleTitle: new FormControl(""),
          crewMember: new FormControl(""),
        }),
      ]),
    );
    console.log("Added Shift");
    console.log("Shifts is now:", this.shiftsFormArray.controls);
  }

  addShiftRole(index: number) {
    const shiftRole: ShiftRole = {
      id: undefined,
      crewMember: "",
      roleTitle: "",
    };
    const shiftFormArray: FormArray = this.shiftsFormArray.controls[index] as FormArray;
    shiftFormArray.push(new FormGroup({
      roleTitle: new FormControl(""),
      crewMember: new FormControl(""),
    }));

    console.log("Added Shift Role:", shiftRole);
    console.log("This Shifts ShiftRoles is now:", shiftFormArray.controls);
  }
}
