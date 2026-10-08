import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import * as i0 from "@angular/core";
export declare class AuthService {
  private http;
  currentUserValue: unknown;
  currentUserSubject: Subject<unknown>;
  constructor(http: HttpClient);
  login(): {};
  logout(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<AuthService, never>;
  static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
declare namespace auth_component_d_exports {
  export { AuthComponent };
}
export declare class AuthComponent {
  static ɵfac: i0.ɵɵFactoryDeclaration<AuthComponent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<AuthComponent, "lib-auth", never, {}, {}, never, never, false, never>;
}
export declare class AuthModule {
  static ɵfac: i0.ɵɵFactoryDeclaration<AuthModule, never>;
  static ɵmod: i0.ɵɵNgModuleDeclaration<AuthModule, [typeof AuthComponent], never, [typeof AuthComponent]>;
  static ɵinj: i0.ɵɵInjectorDeclaration<AuthModule>;
}