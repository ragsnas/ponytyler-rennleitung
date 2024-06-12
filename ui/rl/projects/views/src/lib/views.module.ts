import {NgModule} from '@angular/core';
import {ViewsComponent} from './views.component';
import {CommonModule} from "@angular/common";
import {RouterModule, Routes} from "@angular/router";
import { NextRaceComponent } from './next-race/next-race.component';
import { BackendApiModule } from 'projects/backend-api/src/public-api';
import { UpcommingRacesComponent } from './upcomming-races/upcomming-races.component';
import {MatLegacyTableModule as MatTableModule} from "@angular/material/legacy-table";
import {MatLegacyListModule as MatListModule} from "@angular/material/legacy-list";
import {MatLegacyButtonModule as MatButtonModule} from "@angular/material/legacy-button";

const routes: Routes = [
  { path: '', component: ViewsComponent },
  { path: 'next-race', component: NextRaceComponent },
  { path: 'upcoming-races', component: UpcommingRacesComponent },
];

@NgModule({
  declarations: [
    ViewsComponent,
    NextRaceComponent,
    UpcommingRacesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    BackendApiModule,
    MatTableModule,
    MatListModule,
    MatButtonModule
  ],
  exports: [
    ViewsComponent
  ]
})
export class ViewsModule { }
