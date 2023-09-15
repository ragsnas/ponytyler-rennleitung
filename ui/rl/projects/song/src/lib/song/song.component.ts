import { Component, Input } from '@angular/core';
import { Song } from '../../../../backend-api/src/lib/song.service';

@Component({
  selector: 'lib-song-song',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.scss'],
})
export class SongComponent {
  @Input()
  song: Song | undefined = undefined;
}

