import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'lib-message',
    templateUrl: 'message.component.html',
    styleUrls: ['message.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MessageComponent {
  @Input()
  type: 'error' | 'warn' | 'success' | 'info' = 'warn';
}
