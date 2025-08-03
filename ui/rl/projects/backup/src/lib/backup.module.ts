import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UploadDialogComponent } from "./upload/upload-dialog.component";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { DropzoneMaterialModule } from "@ngx-dropzone/material";
import { MatIcon } from "@angular/material/icon";
import { ReactiveFormsModule } from "@angular/forms";


@NgModule({
  declarations: [UploadDialogComponent],
  imports: [
    CommonModule,
    MatIcon,
    MatFormField,
    MatLabel,
    DropzoneMaterialModule,
    ReactiveFormsModule,
  ],
  exports: []
})
export class BackupModule {
}
