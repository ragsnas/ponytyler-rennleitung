import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ShowModule } from "projects/show/src/lib/show.module";
import { SongModule } from "projects/song/src/lib/song.module";
import { ViewsModule } from "../../projects/views/src/lib/views.module";
import { RaceTrackModule } from "../../projects/race-track/src/lib/race-track.module";
import { UsersModule } from "../../projects/users/src/lib/users/users.module";
import { StatsModule } from "../../projects/stats/src/lib/stats.module";
import { MqttBrokerModule } from "../../projects/mqtt-broker/src/lib/mqtt-broker.module";
import { StateMachineModule } from "../../projects/state-machine/src/lib/state-machine.module";

const routes: Routes = [
  {
    path:'',
    children: [
      {path: '', redirectTo: 'show', pathMatch: 'full'},
      {path: 'show', loadChildren: () => ShowModule},
      {path: 'song', loadChildren: () => SongModule},
      {path: 'views', loadChildren: () => ViewsModule},
      {path: 'users', loadChildren: () => UsersModule},
      {path: 'race-track', loadChildren: () => RaceTrackModule},
      {path: 'stats', loadChildren: () => StatsModule},
      {path: 'mqtt-broker', loadChildren: () => MqttBrokerModule},
      {path: 'state-machine', loadChildren: () => StateMachineModule}
  ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
