import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR, Validators,
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
      multi:true,
      useExisting: UserFormComponent
    }
  ]
})
export class UserFormComponent implements ControlValueAccessor, OnInit, OnDestroy {

  onChangeSubs: Subscription[] = [];
  user: User = {name:''};
  touched = false;

  public form: FormGroup = new FormGroup({
    name: new FormControl(null, [Validators.required, Validators.min(1)])
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe({
      next: (valueChange) => {
        console.log(`valueChange:`, valueChange);
        this.user.name = valueChange.name;
      }
    });
  }

  ngOnDestroy() {
    for (let sub of this.onChangeSubs) {
      sub.unsubscribe();
    }
  }

  registerOnChange(onChange: any) {
    const sub = this.form?.valueChanges.subscribe({
      next: (valueChange) => onChange(valueChange)
    });
    if(sub) {
      this.onChangeSubs.push(sub);
    }
  }

  registerOnTouched(onTouched: Function) {
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

  writeValue(value: any) {
    if (value) {
      this.form?.setValue(value, {emitEvent: false});
    }
  }

  onChange = (user: User) => {};

  onTouched: Function = () => {};

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  validate(control: AbstractControl) {

    if (this.form.valid) {
      return null;
    }

    let errors : any = {};
    errors = this.addControlErrors(errors, "name");

    return errors;
  }

  addControlErrors(allErrors: any, controlName:string) {

    const errors = {...allErrors};

    const controlErrors = this.form.controls[controlName].errors;

    if (controlErrors) {
      errors[controlName] = controlErrors;
    }

    return errors;
  }

}
