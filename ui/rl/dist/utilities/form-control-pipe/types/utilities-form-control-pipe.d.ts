import * as i0 from "@angular/core";
import { PipeTransform } from "@angular/core";
import { AbstractControl, FormControl } from "@angular/forms";
import * as i2 from "@angular/common";
declare namespace form_control_pipe_d_exports {
  export { FormControlPipe };
}
export declare class FormControlPipe implements PipeTransform {
  transform(value: AbstractControl): FormControl;
  static ɵfac: i0.ɵɵFactoryDeclaration<FormControlPipe, never>;
  static ɵpipe: i0.ɵɵPipeDeclaration<FormControlPipe, "formControl", false>;
}
export declare class FormControlPipeModule {
  static ɵfac: i0.ɵɵFactoryDeclaration<FormControlPipeModule, never>;
  static ɵmod: i0.ɵɵNgModuleDeclaration<FormControlPipeModule, [typeof FormControlPipe], [typeof i2.CommonModule], [typeof FormControlPipe]>;
  static ɵinj: i0.ɵɵInjectorDeclaration<FormControlPipeModule>;
}