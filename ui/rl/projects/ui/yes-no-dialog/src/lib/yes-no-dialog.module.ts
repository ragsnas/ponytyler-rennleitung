import { NgModule } from '@angular/core';
import { YesNoDialogComponent } from './yes-no-dialog.component';
import { ButtonListModule } from 'projects/ui/button-list/src/lib/button-list.module';
import {MatButtonModule} from "@angular/material/button";



@NgModule({
  declarations: [
    YesNoDialogComponent,
  ],
  imports: [
    ButtonListModule,
    MatButtonModule
  ],
  exports: [
    YesNoDialogComponent
  ]
})
export class YesNoDialogModule { }
