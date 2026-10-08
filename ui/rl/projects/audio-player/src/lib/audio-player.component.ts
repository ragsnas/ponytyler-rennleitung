import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'lib-audio-player',
    template: `
    <p>
      audio-player works!
    </p>
  `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AudioPlayerComponent {
}
