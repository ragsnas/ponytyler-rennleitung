import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { FormGroup } from "@angular/forms";

@Component({
    selector: "shift-role-from",
    templateUrl: "./shift-role-form.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ShiftRoleFormComponent {
  @Input() shiftJob!: FormGroup;
  @Input() index!: number;
  @Input() jobIndex!: number;

  get isValid() {
    return this.shiftJob.valid;
  }
}
