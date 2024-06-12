import { NgModule } from '@angular/core';
import { YesNoDialogComponent } from './yes-no-dialog.component';
import { ButtonListModule } from 'projects/ui/button-list/src/lib/button-list.module';
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {CommonModule} from "@angular/common";



@NgModule({
  declarations: [
    YesNoDialogComponent,
  ],
  imports: [
    ButtonListModule,
    MatButtonModule,
    MatDialogModule,
    CommonModule
  ],
  exports: [
    YesNoDialogComponent
  ]
})
export class YesNoDialogModule { }
