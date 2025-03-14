import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

@Component({
  selector: "shift-role-from",
  templateUrl: "./shift-role-form.component.html",
})
export class ShiftRoleFormComponent {
  @Input() shiftJob!: FormGroup;
  @Input() index!: number;
  @Input() jobIndex!: number;

  get isValid() {
    return this.shiftJob.valid;
  }
}
