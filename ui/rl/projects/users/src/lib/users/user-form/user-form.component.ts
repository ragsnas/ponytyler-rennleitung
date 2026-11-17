import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from "@angular/core";
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
  ValidationErrors,
} from "@angular/forms";
import { User } from "projects/backend-api/src/lib/user.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'user-form',
    templateUrl: "user-form.component.html",
    styleUrls: ["user-form.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: UserFormComponent
        },
        {
            // makes the parent control invalid while this form is (see validate())
            provide: NG_VALIDATORS,
            multi: true,
            useExisting: UserFormComponent
        }
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserFormComponent implements ControlValueAccessor, OnInit, OnDestroy {

  /** Everything subscribed to the form; unsubscribed on destroy. */
  private readonly subscriptions = new Subscription();
  /** The subscription of the parent's onChange; replaced when the parent registers again. */
  private onChangeSub: Subscription | undefined;
  user: User = {name:''};
  touched = false;

  public form: FormGroup = new FormGroup({
    name: new FormControl(null, [Validators.required, Validators.minLength(1)])
  });

  ngOnInit(): void {
    this.subscriptions.add(this.form.valueChanges.subscribe({
      next: (valueChange) => {
        console.log(`valueChange:`, valueChange);
        this.user.name = valueChange.name;
      }
    }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  registerOnChange(onChange: (value: User) => void) {
    this.onChangeSub?.unsubscribe();
    this.onChangeSub = this.form.valueChanges.subscribe({
      next: (valueChange) => onChange(valueChange)
    });
    this.subscriptions.add(this.onChangeSub);
  }

  registerOnTouched(onTouched: () => void) {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean) {
    if (disabled) {
      this.form?.disable();
    }
    else {
      this.form?.enable();
    }
  }

  writeValue(value: User | null) {
    if (value) {
      this.form?.setValue(value, {emitEvent: false});
    }
  }

  onChange = (_user: User) => {};

  onTouched: () => void = () => {};

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  validate(_control: AbstractControl): ValidationErrors | null {

    if (this.form.valid) {
      return null;
    }

    const errors = this.addControlErrors({}, "name");

    // any object counts as "invalid", also an empty one
    return Object.keys(errors).length > 0 ? errors : null;
  }

  addControlErrors(allErrors: ValidationErrors, controlName:string) {

    const errors = {...allErrors};

    const controlErrors = this.form.controls[controlName].errors;

    if (controlErrors) {
      errors[controlName] = controlErrors;
    }

    return errors;
  }

}
