import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShowModule } from 'projects/show/src/lib/show.module';
import { SongModule } from 'projects/song/src/lib/song.module';
import {ViewsModule} from "../../projects/views/src/lib/views.module";
import {RaceTrackModule} from "../../projects/race-track/src/lib/race-track.module";

const routes: Routes = [
  {
    path:'',
    children: [
      {path: '', redirectTo: 'show', pathMatch: 'full'},
      {path: 'show', loadChildren: () => ShowModule},
      {path: 'song', loadChildren: () => SongModule},
      {path: 'views', loadChildren: () => ViewsModule},
      {path: 'race-track', loadChildren: () => RaceTrackModule}
  ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
