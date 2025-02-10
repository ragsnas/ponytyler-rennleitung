import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { RouterModule, Routes } from "@angular/router";
import { BackendApiModule } from "projects/backend-api/src/public-api";
import { SongSearchModule } from "projects/song-search/src/public-api";
import { ButtonListModule } from "projects/ui/button-list/src/public-api";
import { YesNoDialogModule } from "projects/ui/yes-no-dialog/src/lib/yes-no-dialog.module";
import { CreateRaceComponent } from "./create-race/create-race.component";
import { CreateShowComponent } from "./create-show/create-show.component";
import { ShowDashboardComponent } from "./show-dashboard/show-dashboard.component";
import { ShowComponent } from "./show/show.component";
import { ShowsComponent } from "./shows/shows.component";
import { UpdateRaceComponent } from "./update-race/update-race.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { DirectorDashboardComponent } from "./director-dashboard/director-dashboard.component";
import {
  DirectorDashboardRedirectComponent,
} from "./director-dashboard-redirect/director-dashboard-redirect.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { MatDialogModule } from "@angular/material/dialog";
import { EditShowComponent } from "./edit-show/edit-show.component";
import { MessageModule } from "projects/ui/message/src/public-api";
import { ShiftFormComponent } from "./shift/shift-form.component";
import { ShiftRoleFormComponent } from "./shift/shift-role-form.component";
import { ShiftsDashboardComponent } from "./shifts/dashboard/shifts-dashboard.component";
import { ChooseUsersComponent } from "./shifts/wizzard/steps/choose-users/choose-users.component";
import { WizzardComponent } from "./shifts/wizzard/wizzard.component";

const routes: Routes = [
  { path: "", component: ShowsComponent },
  { path: "director-dashboard-redirect", component: DirectorDashboardRedirectComponent },
  { path: "create", component: CreateShowComponent },
  { path: ":showId/edit", component: EditShowComponent },
  { path: ":showId/create-race", component: CreateRaceComponent },
  { path: ":showId/race/:raceId", component: UpdateRaceComponent },
  { path: ":showId/shifts", component: ShiftsDashboardComponent },
  {
    path: ":showId/shifts/wizzard",
    component: WizzardComponent,
    children: [
      { path: "", redirectTo: "users", pathMatch: "full" },
      { path: "users", component: ChooseUsersComponent },
      { path: "shifts", component: ChooseUsersComponent },
      { path: "roles", component: ChooseUsersComponent },
    ]
  },
  { path: ":showId", component: ShowDashboardComponent },
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
    DirectorDashboardRedirectComponent,
    ShiftFormComponent,
    ShiftRoleFormComponent,
    ShiftsDashboardComponent
  ],
  imports: [CommonModule,
    RouterModule.forChild(routes),
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
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class ShowModule {
}
