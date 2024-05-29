import { NgModule } from '@angular/core';
import { YesNoDialogComponent } from './yes-no-dialog.component';
import { ButtonListModule } from 'projects/ui/button-list/src/lib/button-list.module';



@NgModule({
  declarations: [
    YesNoDialogComponent,
  ],
  imports: [
    ButtonListModule
  ],
  exports: [
    YesNoDialogComponent
  ]
})
export class YesNoDialogModule { }
