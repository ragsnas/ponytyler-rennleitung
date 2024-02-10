import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, Routes } from '@angular/router';
import { BackendApiModule } from 'projects/backend-api/src/public-api';
import { SongSearchModule } from 'projects/song-search/src/public-api';
import { ButtonListModule } from 'projects/ui/button-list/src/public-api';
import { CreateRaceComponent } from './create-race/create-race.component';
import { CreateShowComponent } from './create-show/create-show.component';
import { ShowDashboardComponent } from './show-dashboard/show-dashboard.component';
import { ShowComponent } from './show/show.component';
import { ShowsComponent } from './shows/shows.component';
import { UpdateRaceComponent } from "./update-race/update-race.component";
import {MatSnackBarModule} from "@angular/material/snack-bar";

const routes: Routes = [
  { path: '', component: ShowsComponent },
  { path: 'create', component: CreateShowComponent },
  { path: ':showId/create-race', component: CreateRaceComponent },
  { path: ':showId/race/:raceId', component: UpdateRaceComponent },
  { path: ':showId', component: ShowDashboardComponent },
];

@NgModule({
  declarations: [
    ShowComponent,
    ShowsComponent,
    CreateShowComponent,
    ShowDashboardComponent,
    CreateRaceComponent,
    UpdateRaceComponent
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
    MatSnackBarModule
  ],
  exports: [ShowComponent],
})
export class ShowModule {}
