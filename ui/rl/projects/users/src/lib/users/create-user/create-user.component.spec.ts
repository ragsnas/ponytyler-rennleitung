import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';

import { UserService } from 'projects/backend-api/src/lib/user.service';
import { UserFormComponent } from '../user-form/user-form.component';

import { CreateUserComponent } from './create-user.component';

describe('CreateUserComponent', () => {
  let component: CreateUserComponent;
  let fixture: ComponentFixture<CreateUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateUserComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('CreateUserComponent with the real user form', () => {
  let fixture: ComponentFixture<CreateUserComponent>;
  let userService: jasmine.SpyObj<UserService>;

  const saveButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');
  function type(name: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    userService = jasmine.createSpyObj('UserService', ['createUser']);
    userService.createUser.and.returnValue(of(null) as never);

    await TestBed.configureTestingModule({
      declarations: [CreateUserComponent, UserFormComponent],
      imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
      providers: [{ provide: UserService, useValue: userService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUserComponent);
    fixture.detectChanges();
  });

  it('cannot save without a name', () => {
    expect(saveButton().disabled).toBeTrue();

    fixture.componentInstance.createUser();

    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('can save once a name is typed, and saves it', () => {
    type('Dustin');

    expect(saveButton().disabled).toBeFalse();

    saveButton().click();

    expect(userService.createUser).toHaveBeenCalledOnceWith({ name: 'Dustin' });
  });
});
