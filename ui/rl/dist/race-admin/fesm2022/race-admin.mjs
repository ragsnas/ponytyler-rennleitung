import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, Injectable, NgModule } from "@angular/core";
var RaceAdminService = class RaceAdminService {
	constructor() {}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: RaceAdminService,
		deps: [],
		target: i0.ɵɵFactoryTarget.Injectable
	});
	static ɵprov = i0.ɵɵngDeclareInjectable({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: RaceAdminService,
		providedIn: "root"
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: RaceAdminService,
	decorators: [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}],
	ctorParameters: () => []
});
var RaceAdminComponent = class RaceAdminComponent {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: RaceAdminComponent,
		deps: [],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "14.0.0",
		version: "22.2.1",
		type: RaceAdminComponent,
		isStandalone: false,
		selector: "lib-race-admin",
		ngImport: i0,
		template: "<div id=\"stae\">\n  <div id=\"race-list\">\n  </div>\n  <div id=\"running-state\">\n    <div id=\"waiting\"></div>\n    <div id=\"race\">\n      <div id=\"race-controls\"></div>\n      <div id=\"race-track\"></div>\n    </div>\n    <div id=\"video-player\"></div>\n    <div id=\"music-player\"></div>\n  </div>\n</div>\n",
		styles: [""],
		changeDetection: i0.ChangeDetectionStrategy.Eager
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: RaceAdminComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-race-admin",
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false,
			template: "<div id=\"stae\">\n  <div id=\"race-list\">\n  </div>\n  <div id=\"running-state\">\n    <div id=\"waiting\"></div>\n    <div id=\"race\">\n      <div id=\"race-controls\"></div>\n      <div id=\"race-track\"></div>\n    </div>\n    <div id=\"video-player\"></div>\n    <div id=\"music-player\"></div>\n  </div>\n</div>\n"
		}]
	}]
});
var RaceAdminModule = class RaceAdminModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: RaceAdminModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: RaceAdminModule,
		declarations: [RaceAdminComponent],
		exports: [RaceAdminComponent]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: RaceAdminModule
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: RaceAdminModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [RaceAdminComponent],
			imports: [],
			exports: [RaceAdminComponent]
		}]
	}]
});
export { RaceAdminComponent, RaceAdminModule, RaceAdminService };

//# sourceMappingURL=race-admin.mjs.map