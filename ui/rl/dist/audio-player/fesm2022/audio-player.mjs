import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, Injectable, NgModule } from "@angular/core";
var AudioPlayerService = class AudioPlayerService {
	constructor() {}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AudioPlayerService,
		deps: [],
		target: i0.ɵɵFactoryTarget.Injectable
	});
	static ɵprov = i0.ɵɵngDeclareInjectable({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AudioPlayerService,
		providedIn: "root"
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: AudioPlayerService,
	decorators: [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}],
	ctorParameters: () => []
});
var AudioPlayerComponent = class AudioPlayerComponent {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AudioPlayerComponent,
		deps: [],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "14.0.0",
		version: "22.2.1",
		type: AudioPlayerComponent,
		isStandalone: false,
		selector: "lib-audio-player",
		ngImport: i0,
		template: `
    <p>
      audio-player works!
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
	type: AudioPlayerComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-audio-player",
			template: `
    <p>
      audio-player works!
    </p>
  `,
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false
		}]
	}]
});
var AudioPlayerModule = class AudioPlayerModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AudioPlayerModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AudioPlayerModule,
		declarations: [AudioPlayerComponent],
		exports: [AudioPlayerComponent]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: AudioPlayerModule
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: AudioPlayerModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [AudioPlayerComponent],
			imports: [],
			exports: [AudioPlayerComponent]
		}]
	}]
});
export { AudioPlayerComponent, AudioPlayerModule, AudioPlayerService };

//# sourceMappingURL=audio-player.mjs.map