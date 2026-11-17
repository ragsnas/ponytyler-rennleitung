import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { User } from 'projects/backend-api/src/lib/user.service';
import { UserFormComponent } from './user-form.component';

@Component({
  template: `<user-form [formControl]="control"></user-form>`,
  standalone: false,
})
class HostComponent {
  control = new FormControl<User>({ name: '' });
}

/** valueChanges is an EventEmitter, i.e. a Subject: it knows whether anybody is subscribed. */
const subscribers = (form: UserFormComponent) => (form.form.valueChanges as unknown as Subject<unknown>).observers.length;

describe('UserFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let form: UserFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostComponent, UserFormComponent],
      imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    form = fixture.debugElement.query(By.directive(UserFormComponent)).componentInstance;
  });

  function type(name: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('makes the control it is bound to invalid while the name is empty', () => {
    expect(host.control.invalid).toBeTrue();
    expect(host.control.errors).toEqual({ name: { required: true } });
  });

  it('makes the control valid, and keeps it in step, as the name is typed', () => {
    type('Dustin');
    expect(host.control.valid).toBeTrue();
    expect(host.control.value).toEqual({ name: 'Dustin' });

    type('');
    expect(host.control.invalid).toBeTrue();
  });

  it('accepts any non-empty text as a name, also one that looks like a number', () => {
    type('0');
    expect(host.control.valid).toBeTrue();
  });

  it('reports no errors (null, not an empty object) when its form is invalid without control errors', () => {
    form.form.disable();

    expect(form.validate(host.control)).toBeNull();
  });

  it('marks the control as touched when the name field is left', () => {
    expect(host.control.touched).toBeFalse();

    fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));

    expect(host.control.touched).toBeTrue();
  });

  it('shows why the name is invalid once the field was touched', () => {
    fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('required');
  });

  it('does not leave subscriptions on its form behind when destroyed', () => {
    expect(subscribers(form)).toBeGreaterThan(0);

    fixture.destroy();

    expect(subscribers(form)).toBe(0);
  });

  it('keeps one change subscription when the parent registers again', () => {
    const before = subscribers(form);

    form.registerOnChange(() => {});
    form.registerOnChange(() => {});

    expect(subscribers(form)).toBe(before);
  });
});
