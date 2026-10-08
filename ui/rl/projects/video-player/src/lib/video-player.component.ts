import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'lib-video-player',
    template: `
    <p>
      video-player works!
    </p>
  `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class VideoPlayerComponent {
}
