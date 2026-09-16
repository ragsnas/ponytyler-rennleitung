import { RouterModule, Routes } from "@angular/router";
import { StateMachineComponent } from "./state-machine.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BackendApiModule } from "projects/backend-api/src/public-api";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { ButtonListModule } from 'projects/ui/button-list/src/lib/button-list.module';


const routes: Routes = [
  { path: "", component: StateMachineComponent },
];

@NgModule({
  declarations: [StateMachineComponent],
  imports: [
    CommonModule,
    BackendApiModule,
    RouterModule.forChild(routes),
    MatButton,
    MatIcon,
    ButtonListModule,
  ],
  exports: [StateMachineComponent],
})
export class StateMachineModule {
}

