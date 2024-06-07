import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RaceService } from './race.service';
import { ShowService } from './show.service';
import { SongService } from './song.service';
import { StatisticsService } from "./statistics.service";



@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    SongService,
    ShowService,
    RaceService,
    StatisticsService
  ]
})
export class BackendApiModule { }
