import { NgModule } from '@angular/core';
import { SongSyncOriginComponent } from './song-sync-origin.component';
import {MatIconModule} from "@angular/material/icon";
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [
    SongSyncOriginComponent
  ],
  imports: [
    MatIconModule,
    CommonModule
  ],
  exports: [
    SongSyncOriginComponent
  ]
})
export class SongSyncOriginModule { }
