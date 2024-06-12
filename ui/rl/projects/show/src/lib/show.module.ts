import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { RouterModule, Routes } from '@angular/router';
import { BackendApiModule } from 'projects/backend-api/src/public-api';
import { SongSearchModule } from 'projects/song-search/src/public-api';
import { ButtonListModule } from 'projects/ui/button-list/src/public-api';
import { YesNoDialogModule } from 'projects/ui/yes-no-dialog/src/lib/yes-no-dialog.module';
import { CreateRaceComponent } from './create-race/create-race.component';
import { CreateShowComponent } from './create-show/create-show.component';
import { ShowDashboardComponent } from './show-dashboard/show-dashboard.component';
import { ShowComponent } from './show/show.component';
import { ShowsComponent } from './shows/shows.component';
import { UpdateRaceComponent } from "./update-race/update-race.component";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { DirectorDashboardComponent } from './director-dashboard/director-dashboard.component';
import { DirectorDashboardRedirectComponent } from './director-dashboard-redirect/director-dashboard-redirect.component';
import {MatLegacyProgressSpinnerModule as MatProgressSpinnerModule} from "@angular/material/legacy-progress-spinner";
import {MatLegacyProgressBarModule as MatProgressBarModule} from "@angular/material/legacy-progress-bar";
import {MatLegacySelectModule as MatSelectModule} from "@angular/material/legacy-select";
import {MatLegacyDialogModule as MatDialogModule} from "@angular/material/legacy-dialog";
import {EditShowComponent} from "./edit-show/edit-show.component";
import {MessageModule} from 'projects/ui/message/src/public-api';

const routes: Routes = [
  { path: '', component: ShowsComponent },
  { path: 'director-dashboard-redirect', component: DirectorDashboardRedirectComponent },
  { path: 'create', component: CreateShowComponent },
  { path: ':showId/edit', component: EditShowComponent },
  { path: ':showId/create-race', component: CreateRaceComponent },
  { path: ':showId/race/:raceId', component: UpdateRaceComponent },
  { path: ':showId/director-dashboard', component: DirectorDashboardComponent },
  { path: ':showId', component: ShowDashboardComponent },
];

@NgModule({
  declarations: [
    ShowComponent,
    ShowsComponent,
    CreateShowComponent,
    EditShowComponent,
    ShowDashboardComponent,
    CreateRaceComponent,
    UpdateRaceComponent,
    DirectorDashboardComponent,
    DirectorDashboardRedirectComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBadgeModule,
    BackendApiModule,
    SongSearchModule,
    ButtonListModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatDialogModule,
    YesNoDialogModule,
    MessageModule
  ],
  exports: [ShowComponent],
})
export class ShowModule {}
