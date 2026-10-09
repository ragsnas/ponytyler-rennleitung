import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'lib-views',
    templateUrl: './views.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ViewsComponent {
}
