import {NgModule} from '@angular/core';
import {RaceTrackComponent} from './race-track.component';
import {RouterModule, Routes} from "@angular/router";
import {CommonModule} from "@angular/common";
import {MatLegacyProgressBarModule as MatProgressBarModule} from "@angular/material/legacy-progress-bar";

const routes: Routes = [
  { path: '', component: RaceTrackComponent },
];

@NgModule({
  declarations: [
    RaceTrackComponent
  ],
  imports: [
    CommonModule,
    MatProgressBarModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    RaceTrackComponent
  ]
})
export class RaceTrackModule { }
