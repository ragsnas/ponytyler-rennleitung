import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Song } from '../../../../backend-api/src/lib/song.service';

@Component({
    selector: 'lib-song-song',
    templateUrl: './song.component.html',
    styleUrls: ['./song.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SongComponent {
  @Input()
  song: Song | undefined = undefined;
}

