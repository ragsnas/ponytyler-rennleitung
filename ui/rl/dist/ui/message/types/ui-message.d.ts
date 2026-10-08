import * as i0 from "@angular/core";
declare namespace message_component_d_exports {
  export { MessageComponent };
}
export declare class MessageComponent {
  type: 'error' | 'warn' | 'success' | 'info';
  static ɵfac: i0.ɵɵFactoryDeclaration<MessageComponent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<MessageComponent, "lib-message", never, {
    "type": {
      "alias": "type";
      "required": false;
    };
  }, {}, never, ["*"], false, never>;
}
export declare class MessageModule {
  static ɵfac: i0.ɵɵFactoryDeclaration<MessageModule, never>;
  static ɵmod: i0.ɵɵNgModuleDeclaration<MessageModule, [typeof MessageComponent], never, [typeof MessageComponent]>;
  static ɵinj: i0.ɵɵInjectorDeclaration<MessageModule>;
}