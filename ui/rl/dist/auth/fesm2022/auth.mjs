import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, Injectable, NgModule } from "@angular/core";
import { Subject } from "rxjs";
import * as i1 from "@angular/common/http";
var AuthService = class AuthService {
	http;
	currentUserValue;
	currentUserSubject = new Subject();
	constructor(http) {
		this.http = http;
	}
	login() {
		return {};
	}
	logout() {
		localStorage.removeItem("currentUser");
		this.currentUserSubject.next(null);
	}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AuthService,
		deps: [{ token: i1.HttpClient }],
		target: i0.ɵɵFactoryTarget.Injectable
	});
	static ɵprov = i0.ɵɵngDeclareInjectable({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AuthService,
		providedIn: "root"
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: AuthService,
	decorators: [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}],
	ctorParameters: () => [{ type: i1.HttpClient }]
});
var AuthComponent = class AuthComponent {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AuthComponent,
		deps: [],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "14.0.0",
		version: "22.2.1",
		type: AuthComponent,
		isStandalone: false,
		selector: "lib-auth",
		ngImport: i0,
		template: `
    <p>
      auth works!
    </p>
  `,
		isInline: true,
		changeDetection: i0.ChangeDetectionStrategy.Eager
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: AuthComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-auth",
			template: `
    <p>
      auth works!
    </p>
  `,
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false
		}]
	}]
});
var AuthModule = class AuthModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AuthModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AuthModule,
		declarations: [AuthComponent],
		exports: [AuthComponent]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AuthModule
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: AuthModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [AuthComponent],
			imports: [],
			exports: [AuthComponent]
		}]
	}]
});
export { AuthComponent, AuthModule, AuthService };

//# sourceMappingURL=auth.mjs.map