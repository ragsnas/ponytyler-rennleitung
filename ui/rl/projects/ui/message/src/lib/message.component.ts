import {Component, Input} from '@angular/core';

@Component({
  selector: 'lib-message',
  templateUrl: 'message.component.html',
  styleUrls: ['message.component.scss']
})
export class MessageComponent {
  @Input()
  type: 'error' | 'warn' | 'success' | 'info' = 'warn';
}
