import { NgModule } from '@angular/core';
import { SongsComponent } from './songs.component';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SongService } from './song.service';

const routes: Routes = [{ path: '', component: SongsComponent }];

@NgModule({
  declarations: [SongsComponent],
  imports: [RouterModule.forChild(routes), HttpClientModule],
  providers: [SongService],
  exports: [SongsComponent],
})
export class SongModule {}
