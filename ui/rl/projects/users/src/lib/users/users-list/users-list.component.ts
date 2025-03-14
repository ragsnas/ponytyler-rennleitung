import { Component, OnInit } from "@angular/core";
import { User, UserService } from "projects/backend-api/src/lib/user.service";
import { Observable } from "rxjs";

@Component({
  selector: 'lib-users-list',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  users$: Observable<User[]> | undefined;

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.users$ = this.userService.getUsers();
  }
}
