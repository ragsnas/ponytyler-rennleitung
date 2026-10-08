import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, NgModule, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import * as i4 from "@ngx-dropzone/cdk";
import { FileInputDirective, FileInputValidators } from "@ngx-dropzone/cdk";
import * as i5 from "@angular/forms";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import * as i1 from "@angular/material/icon";
import { MatIcon } from "@angular/material/icon";
import * as i2 from "@angular/material/form-field";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import * as i3 from "@ngx-dropzone/material";
import { MatDropzone } from "@ngx-dropzone/material";
var UploadDialogComponent = class UploadDialogComponent {
	dialogRef = inject(MatDialogRef);
	data = inject(MAT_DIALOG_DATA);
	validators = [FileInputValidators.accept("text/plain")];
	backupFile = new FormControl(null, this.validators);
	onNoClick() {
		this.dialogRef.close();
	}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: UploadDialogComponent,
		deps: [],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "14.0.0",
		version: "22.2.1",
		type: UploadDialogComponent,
		isStandalone: false,
		selector: "lib-upload",
		ngImport: i0,
		template: "<mat-form-field appearance=\"fill\">\n  <mat-label>Drop Backup Here!</mat-label>\n  <ngx-mat-dropzone >\n    <input type=\"file\" fileInput [formControl]=\"backupFile\" />\n  </ngx-mat-dropzone>\n  <mat-icon matSuffix color=\"primary\">cloud_upload</mat-icon>\n</mat-form-field>\n",
		styles: [""],
		dependencies: [
			{
				kind: "component",
				type: i1.MatIcon,
				selector: "mat-icon",
				inputs: [
					"color",
					"inline",
					"svgIcon",
					"fontSet",
					"fontIcon"
				],
				exportAs: ["matIcon"]
			},
			{
				kind: "component",
				type: i2.MatFormField,
				selector: "mat-form-field",
				inputs: [
					"hideRequiredMarker",
					"color",
					"floatLabel",
					"appearance",
					"subscriptSizing",
					"hintLabel"
				],
				exportAs: ["matFormField"]
			},
			{
				kind: "directive",
				type: i2.MatLabel,
				selector: "mat-label"
			},
			{
				kind: "component",
				type: i3.MatDropzone,
				selector: "ngx-mat-dropzone",
				inputs: [
					"aria-describedby",
					"placeholder",
					"required"
				],
				exportAs: ["matDropzone"]
			},
			{
				kind: "directive",
				type: i4.FileInputDirective,
				selector: "input[fileInput]",
				inputs: [
					"value",
					"touched",
					"invalid",
					"required",
					"accept",
					"mode",
					"disabled"
				],
				outputs: [
					"valueChange",
					"touchedChange",
					"selectionChange",
					"touch"
				],
				exportAs: ["fileInput"]
			},
			{
				kind: "directive",
				type: i5.DefaultValueAccessor,
				selector: "input:not([type=checkbox]):not([ngNoCva])[formControlName],textarea:not([ngNoCva])[formControlName],input:not([type=checkbox]):not([ngNoCva])[formControl],textarea:not([ngNoCva])[formControl],input:not([type=checkbox]):not([ngNoCva])[ngModel],textarea:not([ngNoCva])[ngModel],[ngDefaultControl]"
			},
			{
				kind: "directive",
				type: i5.NgControlStatus,
				selector: "[formControlName],[ngModel],[formControl]"
			},
			{
				kind: "directive",
				type: i5.FormControlDirective,
				selector: "[formControl]",
				inputs: [
					"formControl",
					"disabled",
					"ngModel"
				],
				outputs: ["ngModelChange"],
				exportAs: ["ngForm"]
			}
		],
		changeDetection: i0.ChangeDetectionStrategy.Eager
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: UploadDialogComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-upload",
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false,
			template: "<mat-form-field appearance=\"fill\">\n  <mat-label>Drop Backup Here!</mat-label>\n  <ngx-mat-dropzone >\n    <input type=\"file\" fileInput [formControl]=\"backupFile\" />\n  </ngx-mat-dropzone>\n  <mat-icon matSuffix color=\"primary\">cloud_upload</mat-icon>\n</mat-form-field>\n"
		}]
	}]
});
var BackupModule = class BackupModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: BackupModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: BackupModule,
		declarations: [UploadDialogComponent],
		imports: [
			CommonModule,
			MatIcon,
			MatFormField,
			MatLabel,
			MatDropzone,
			FileInputDirective,
			ReactiveFormsModule
		]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: BackupModule,
		imports: [
			CommonModule,
			MatIcon,
			MatFormField,
			MatDropzone,
			ReactiveFormsModule
		]
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: BackupModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [UploadDialogComponent],
			imports: [
				CommonModule,
				MatIcon,
				MatFormField,
				MatLabel,
				MatDropzone,
				FileInputDirective,
				ReactiveFormsModule
			],
			exports: []
		}]
	}]
});
export { BackupModule, UploadDialogComponent };

//# sourceMappingURL=backup.mjs.map