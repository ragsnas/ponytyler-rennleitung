import { Component, OnInit } from "@angular/core";
import { User, UserService } from "projects/backend-api/src/lib/user.service";
import { Form, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { WizzardService } from "../../wizzard.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "lib-choose-users",
  templateUrl: "./choose-users.component.html",
  styleUrl: "./choose-users.component.css",
})
export class ChooseUsersComponent implements OnInit {

  users: User[] | undefined;
  form: FormGroup = new FormGroup({
    users: new FormControl<User[]>([], [Validators.required])
  })

  constructor(
    private userService: UserService,
    private wizzardService: WizzardService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        users.forEach(user =>
          this.form.addControl(
            `user_${user.id}`,
            new FormControl<boolean>(false)
          )
        )
      }
    });
  }

  nextStep() {
    const selectedUsers: User[] = this.users!.filter((user: User) =>
      this.form.controls[`user_${user.id}`].getRawValue()
    );
    this.wizzardService.selectUsers(selectedUsers);
    this.router.navigate(["..", "shifts"], { relativeTo: this.route });
  }
}
