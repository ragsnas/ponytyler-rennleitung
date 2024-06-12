import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BackendApiModule } from 'projects/backend-api/src/public-api';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [InputComponent],
  imports: [
    CommonModule,
    BackendApiModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  exports: [InputComponent],
})
export class SongSearchModule {}
