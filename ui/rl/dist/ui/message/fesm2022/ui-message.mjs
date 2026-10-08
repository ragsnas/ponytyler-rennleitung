import * as i0 from "@angular/core";
import { ChangeDetectionStrategy, Component, Input, NgModule } from "@angular/core";
var MessageComponent = class MessageComponent {
	type = "warn";
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MessageComponent,
		deps: [],
		target: i0.ɵɵFactoryTarget.Component
	});
	static ɵcmp = i0.ɵɵngDeclareComponent({
		minVersion: "14.0.0",
		version: "22.2.1",
		type: MessageComponent,
		isStandalone: false,
		selector: "lib-message",
		inputs: { type: "type" },
		ngImport: i0,
		template: "<p class=\"message message-{{type}}\">\n  <ng-content></ng-content>\n</p>\n",
		styles: [".message{border:1px dotted #333333;padding:10px;margin:10px 0}.message-error{color:#fff;background-color:#8b0000}.message-warn{color:red;background-color:#f5f5f5}.message-info{color:#00008b;background-color:#add8e6}.message-success{color:#fff;background-color:#006400}\n"],
		changeDetection: i0.ChangeDetectionStrategy.Eager
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: MessageComponent,
	decorators: [{
		type: Component,
		args: [{
			selector: "lib-message",
			changeDetection: ChangeDetectionStrategy.Eager,
			standalone: false,
			template: "<p class=\"message message-{{type}}\">\n  <ng-content></ng-content>\n</p>\n",
			styles: [".message{border:1px dotted #333333;padding:10px;margin:10px 0}.message-error{color:#fff;background-color:#8b0000}.message-warn{color:red;background-color:#f5f5f5}.message-info{color:#00008b;background-color:#add8e6}.message-success{color:#fff;background-color:#006400}\n"]
		}]
	}],
	propDecorators: { type: [{ type: Input }] }
});
var MessageModule = class MessageModule {
	static ɵfac = i0.ɵɵngDeclareFactory({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MessageModule,
		deps: [],
		target: i0.ɵɵFactoryTarget.NgModule
	});
	static ɵmod = i0.ɵɵngDeclareNgModule({
		minVersion: "14.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MessageModule,
		declarations: [MessageComponent],
		exports: [MessageComponent]
	});
	static ɵinj = i0.ɵɵngDeclareInjector({
		minVersion: "12.0.0",
		version: "22.2.1",
		ngImport: i0,
		type: MessageModule
	});
};
i0.ɵɵngDeclareClassMetadata({
	minVersion: "12.0.0",
	version: "22.2.1",
	ngImport: i0,
	type: MessageModule,
	decorators: [{
		type: NgModule,
		args: [{
			declarations: [MessageComponent],
			imports: [],
			exports: [MessageComponent]
		}]
	}]
});
export { MessageComponent, MessageModule };

//# sourceMappingURL=ui-message.mjs.map