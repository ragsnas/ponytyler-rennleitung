import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, Injectable, NgModule } from "@angular/core";
var VideoPlayerService = class VideoPlayerService {
	constructor() {}
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: VideoPlayerService,
		deps: [],
		target: i0.ɵɵFactoryTarget.Injectable
	});
	static ɵprov = i0.ɵɵngDeclareInjectable({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: VideoPlayerService,
		providedIn: "root"
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: VideoPlayerService,
	decorators: [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}],
	ctorParameters: () => []
});
var VideoPlayerComponent = class VideoPlayerComponent {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: VideoPlayerComponent,
		deps: [],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "14.0.0",
		version: "22.2.1",
		type: VideoPlayerComponent,
		isStandalone: false,
		selector: "lib-video-player",
		ngImport: i0,
		template: `
    <p>
      video-player works!
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
	type: VideoPlayerComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-video-player",
			template: `
    <p>
      video-player works!
    </p>
  `,
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false
		}]
	}]
});
var VideoPlayerModule = class VideoPlayerModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: VideoPlayerModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: VideoPlayerModule,
		declarations: [VideoPlayerComponent],
		exports: [VideoPlayerComponent]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: VideoPlayerModule
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: VideoPlayerModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [VideoPlayerComponent],
			imports: [],
			exports: [VideoPlayerComponent]
		}]
	}]
});
export { VideoPlayerComponent, VideoPlayerModule, VideoPlayerService };

//# sourceMappingURL=video-player.mjs.map