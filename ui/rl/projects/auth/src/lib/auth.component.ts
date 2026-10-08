import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'lib-auth',
    template: `
    <p>
      auth works!
    </p>
  `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AuthComponent {
}
