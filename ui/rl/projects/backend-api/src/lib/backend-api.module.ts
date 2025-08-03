import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RaceService } from "./race.service";
import { ShowService } from "./show.service";
import { SongService } from "./song.service";
import { StatisticsService } from "./statistics.service";
import { UserService } from "./user.service";
import { BackupService } from "./backup.service";


@NgModule({
  imports: [], providers: [
    SongService,
    ShowService,
    RaceService,
    UserService,
    StatisticsService,
    BackupService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class BackendApiModule {
}
