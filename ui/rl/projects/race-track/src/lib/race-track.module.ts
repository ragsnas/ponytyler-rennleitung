import { NgModule } from "@angular/core";
import { RaceTrackComponent } from "./race-track.component";
import { CommonModule } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { BackendApiModule } from "projects/backend-api/src/public-api";
import { MatIcon } from "@angular/material/icon";

@NgModule({
  declarations: [
    RaceTrackComponent,
  ],
  imports: [
    CommonModule,
    MatProgressBarModule,
    BackendApiModule,
    MatIcon,
  ],
  exports: [
    RaceTrackComponent,
  ],
})
export class RaceTrackModule {
}
