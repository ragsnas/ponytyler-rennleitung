import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
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
import { AddEncoreComponent } from "./add-encore/add-encore.component";
import { CreateRaceComponent } from "./create-race/create-race.component";
import { CreateShowComponent } from "./create-show/create-show.component";
import { ShowDashboardComponent } from "./show-dashboard/show-dashboard.component";
import { ShowsComponent } from "./shows/shows.component";
import { UpdateRaceComponent } from "./update-race/update-race.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { DirectorDashboardComponent } from "./director-dashboard/director-dashboard.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatDialogModule } from "@angular/material/dialog";
import { EditShowComponent } from "./edit-show/edit-show.component";
import { MessageModule } from "projects/ui/message/src/public-api";
import { ShiftsDashboardComponent } from "./shifts/dashboard/shifts-dashboard.component";
import { ChooseUsersComponent } from "./shifts/wizzard/steps/choose-users/choose-users.component";
import { WizzardComponent } from "./shifts/wizzard/wizzard.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ChooseShiftsComponent } from "./shifts/wizzard/steps/choose-shifts/choose-shifts.component";

const routes: Routes = [
  { path: "", component: ShowsComponent },
  { path: "create", component: CreateShowComponent },
  { path: ":showId/edit", component: EditShowComponent },
  { path: ":showId/create-race", component: CreateRaceComponent },
  { path: ":showId/add-encore", component: AddEncoreComponent },
  { path: ":showId/race/:raceId", component: UpdateRaceComponent },
  { path: ":showId/shifts", component: ShiftsDashboardComponent },
  {
    path: ":showId/shifts/wizzard",
    component: WizzardComponent,
    children: [
      { path: "", redirectTo: "users", pathMatch: "full" },
      { path: "users", component: ChooseUsersComponent },
      { path: "shifts", component: ChooseShiftsComponent },
      { path: "roles", component: ChooseUsersComponent },
    ]
  },
  { path: ":showId", component: ShowDashboardComponent },
];

@NgModule({
  declarations: [
    ShowsComponent,
    CreateShowComponent,
    EditShowComponent,
    ShowDashboardComponent,
    CreateRaceComponent,
    AddEncoreComponent,
    UpdateRaceComponent,
    DirectorDashboardComponent,
    ShiftsDashboardComponent,
    ChooseUsersComponent,
    ChooseShiftsComponent
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
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBadgeModule,
    BackendApiModule,
    SongSearchModule,
    ButtonListModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    YesNoDialogModule,
    MessageModule
  ],
  providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())],
})
export class ShowModule {
}
