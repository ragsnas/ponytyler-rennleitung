import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControlPipe } from './form-control.pipe';



@NgModule({
  imports: [CommonModule],
  declarations: [FormControlPipe],
  exports: [FormControlPipe]
})
export class FormControlPipeModule { }
