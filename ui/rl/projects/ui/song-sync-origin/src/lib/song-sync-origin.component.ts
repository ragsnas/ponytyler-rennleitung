import {Component, Input} from '@angular/core';
import {Origin} from 'projects/backend-api/src/lib/song.service';

@Component({
  selector: 'lib-song-sync-origin',
  templateUrl: 'song-sync-origin.component.html',
  styleUrls: ['song-sync-origin.component.scss']
})
export class SongSyncOriginComponent {

  @Input()
  origin: Origin | undefined = undefined;

}
