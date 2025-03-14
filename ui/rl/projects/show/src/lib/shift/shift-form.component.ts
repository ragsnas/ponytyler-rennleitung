import { Component, Input } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";

@Component({
  selector: "shift-from",
  templateUrl: "./shift-form.component.html",
})
export class ShiftFormComponent {
  @Input() shift!: FormArray;
  @Input() form!: FormGroup;
  @Input() index!: number;

  get isValid() {
    return this.shift.valid;
  }

  getShiftControlsAsFormGroups(): FormGroup[] {
    return this.shift.controls as FormGroup[];
  }
}
