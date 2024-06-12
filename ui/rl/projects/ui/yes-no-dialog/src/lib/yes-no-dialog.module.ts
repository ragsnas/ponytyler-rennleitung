import { NgModule } from '@angular/core';
import { YesNoDialogComponent } from './yes-no-dialog.component';
import { ButtonListModule } from 'projects/ui/button-list/src/lib/button-list.module';
import {MatLegacyButtonModule as MatButtonModule} from "@angular/material/legacy-button";
import {MatLegacyDialogModule as MatDialogModule} from "@angular/material/legacy-dialog";
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
