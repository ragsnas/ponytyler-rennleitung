import * as i0 from "@angular/core";
import { NgModule, Pipe } from "@angular/core";
import { CommonModule } from "@angular/common";
var FormControlPipe = class FormControlPipe {
	transform(value) {
		return value;
	}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: FormControlPipe,
		deps: [],
		target: i0.ɵɵFactoryTarget.Pipe
	});
	static ɵpipe = i0.ɵɵngDeclarePipe({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: FormControlPipe,
		isStandalone: false,
		name: "formControl"
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: FormControlPipe,
	decorators: [{
		type: Pipe,
		args: [{
			name: "formControl",
			standalone: false
		}]
	}]
});
var FormControlPipeModule = class FormControlPipeModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: FormControlPipeModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: FormControlPipeModule,
		declarations: [FormControlPipe],
		imports: [CommonModule],
		exports: [FormControlPipe]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: FormControlPipeModule,
		imports: [CommonModule]
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: FormControlPipeModule,
	decorators: [{
		type: NgModule,
		args: [{
			imports: [CommonModule],
			declarations: [FormControlPipe],
			exports: [FormControlPipe]
		}]
	}]
});
export { FormControlPipe, FormControlPipeModule };

//# sourceMappingURL=utilities-form-control-pipe.mjs.map