import * as i0 from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import * as i6 from "@ngx-dropzone/cdk";
import { FileInputValue } from "@ngx-dropzone/cdk";
import * as i7 from "@angular/forms";
import { FormControl } from "@angular/forms";
import * as i2 from "@angular/common";
import * as i3 from "@angular/material/icon";
import * as i4 from "@angular/material/form-field";
import * as i5 from "@ngx-dropzone/material";
declare namespace upload_dialog_component_d_exports {
  export { UploadDialogComponent };
}
export declare class UploadDialogComponent {
  readonly dialogRef: MatDialogRef<any, any>;
  readonly data: object;
  validators: import("@angular/forms").ValidatorFn[];
  backupFile: FormControl<FileInputValue>;
  onNoClick(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<UploadDialogComponent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<UploadDialogComponent, "lib-upload", never, {}, {}, never, never, false, never>;
}
export declare class BackupModule {
  static ɵfac: i0.ɵɵFactoryDeclaration<BackupModule, never>;
  static ɵmod: i0.ɵɵNgModuleDeclaration<BackupModule, [typeof UploadDialogComponent], [typeof i2.CommonModule, typeof i3.MatIcon, typeof i4.MatFormField, typeof i4.MatLabel, typeof i5.MatDropzone, typeof i6.FileInputDirective, typeof i7.ReactiveFormsModule], never>;
  static ɵinj: i0.ɵɵInjectorDeclaration<BackupModule>;
}