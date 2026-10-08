import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Show } from 'projects/backend-api/src/lib/show.service';

@Component({
    selector: 'lib-show',
    templateUrl: './show.component.html',
    styleUrls: ['./show.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ShowComponent {

  @Input()
  show: Show | undefined = undefined;

}
