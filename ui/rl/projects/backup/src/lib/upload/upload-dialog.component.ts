import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FileInputValidators, FileInputValue } from "@ngx-dropzone/cdk";
import { FormControl } from "@angular/forms";

export interface DialogData {}

@Component({
  selector: 'lib-upload',
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.css'
})
export class UploadDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UploadDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  validators = [FileInputValidators.accept("text/plain")];
  backupFile = new FormControl<FileInputValue>(null, this.validators);

  onNoClick(): void {
    this.dialogRef.close();
  }
}
