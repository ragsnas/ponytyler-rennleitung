import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShowsComponent } from './shows/shows.component';
import { CreateShowComponent } from './create-show/create-show.component';
import { ShowComponent } from './show/show.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ShowDashboardComponent } from './show-dashboard/show-dashboard.component';
import { CreateRaceComponent } from './create-race/create-race.component';
import { BackendApiModule } from 'projects/backend-api/src/public-api';

const routes: Routes = [
  { path: '', component: ShowsComponent },
  { path: 'create', component: CreateShowComponent },
  { path: ':showId/create-race', component: CreateRaceComponent },
  { path: ':showId', component: ShowDashboardComponent },
];

@NgModule({
  declarations: [
    ShowComponent,
    ShowsComponent,
    CreateShowComponent,
    ShowDashboardComponent,
    CreateRaceComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    BackendApiModule
  ],
  exports: [ShowComponent],
})
export class ShowModule {}
