import { Component } from "@angular/core";
import { Shift, ShiftRole } from "../../../../../../../backend-api/src/lib/shift.service";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";

@Component({
  selector: "lib-choose-shifts",
  templateUrl: "./choose-shifts.component.html",
  styleUrl: "./choose-shifts.component.css",
})
export class ChooseShiftsComponent {
  shifts: Shift[] = [];
  shiftsRoles: ShiftRole[] = [];

  formBuilder: FormBuilder;
  form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    this.formBuilder = formBuilder;
    this.form = this.formBuilder.group({
      shifts: new FormControl(1),
      shiftRoles: this.formBuilder.group({
        "1": this.formBuilder.array([]),
      }),
    });
  }

  nextStep() {
  }

  setShiftCountTo(numberOfShifts: number) {
    if (this.form.controls["shiftRoles"]) {
      this.form.removeControl("shiftRoles");
    }
    this.form.addControl("shiftRoles", this.createShiftRoles(numberOfShifts));
  }

  private createShiftRoles(shifts: number): FormGroup {
    const formGroup: FormGroup = this.formBuilder.group({});
    for (let shiftIndex = 0; shiftIndex <= shifts; shiftIndex++) {
      formGroup.addControl(
        shiftIndex.toString(),
        this.formBuilder.group({
          moderation1: new FormControl(),
          moderation2: new FormControl(),
          moderation3: new FormControl(),
          technik1: new FormControl(),
          technik2: new FormControl(),
          bikeHelp1: new FormControl(),
          bikeHelp2: new FormControl(),
          raceManagement1: new FormControl(),
          raceManagement2: new FormControl(),
          gogoDancer1: new FormControl(),
          gogoDancer2: new FormControl(),
          gogoDancer3: new FormControl(),
          gogoDancer4: new FormControl(),
          gogoDancer5: new FormControl(),
          gogoDancer6: new FormControl(),
          gogoDancer7: new FormControl(),
          gogoDancer8: new FormControl(),
        }),
      );
    }

    return formGroup;
  }
}
