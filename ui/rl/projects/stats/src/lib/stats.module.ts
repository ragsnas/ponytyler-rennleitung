import { NgModule } from "@angular/core";
import { RouterLink, RouterModule, RouterOutlet, Routes } from "@angular/router";
import { StatsComponent } from "./stats.component";
import { SongsComponent } from "./stats/songs/songs.component";
import { AsyncPipe, CommonModule, JsonPipe, NgIf } from "@angular/common";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from "@angular/material/table";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatList, MatListItem } from "@angular/material/list";

const routes: Routes = [
  {
    path: "",
    component: StatsComponent,
    children: [
      { path: "songs/:songStatType", component: SongsComponent },
    ],
  },
];

@NgModule({
  declarations: [StatsComponent, SongsComponent],
  imports: [
    MatList,
    MatListItem,
    RouterLink,
    RouterOutlet,
    MatTable,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatProgressSpinner,
    CommonModule,
    RouterModule.forChild(routes),
    MatHeaderCellDef,
  ],
  exports: [RouterModule],
})
export class StatsModule {
}
