import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ShowService } from './show.service';
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

const routes: Routes = [
  { path: '', component: ShowsComponent },
  { path: 'create', component: CreateShowComponent },
  { path: ':showId', component: ShowDashboardComponent },
];

@NgModule({
  declarations: [ShowComponent, ShowsComponent, CreateShowComponent, ShowDashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  providers: [ShowService],
  exports: [ShowComponent],
})
export class ShowModule {}
