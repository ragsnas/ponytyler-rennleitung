import { NgModule } from "@angular/core";
import { AsyncPipe, CommonModule, NgIf } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { UsersListComponent } from "./users-list/users-list.component";
import { MatButton, MatButtonModule, MatIconButton } from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable, MatTableModule,
} from "@angular/material/table";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { ButtonListModule } from "projects/ui/button-list/src/public-api";
import { MessageModule } from "projects/ui/message/src/public-api";
import { UserService } from "projects/backend-api/src/lib/user.service";
import { UserFormComponent } from "./user-form/user-form.component";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput, MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { CreateUserComponent } from "./create-user/create-user.component";
import { EditUserComponent } from "./edit-user/edit-user.component";
import { DeleteUserComponent } from "./delete-user/delete-user.component";


const routes: Routes = [
  { path: '', component: UsersListComponent },
  { path: 'create', component: CreateUserComponent },
  { path: 'edit/:id', component: EditUserComponent },
  { path: 'delete/:id', component: DeleteUserComponent }
];

@NgModule({
  declarations: [
    UsersListComponent,
    CreateUserComponent,
    EditUserComponent,
    DeleteUserComponent,
    UserFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AsyncPipe,
    ButtonListModule,
    MessageModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule

  ],
  exports: [UsersListComponent, UserFormComponent],
  providers: [UserService]
})
export class UsersModule { }
