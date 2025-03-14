import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { User, UserService } from "projects/backend-api/src/lib/user.service";
import { ActivatedRoute, Router } from "@angular/router";


@Component({
  selector: 'lib-create-user',
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css'
})
export class CreateUserComponent {

  public form: FormGroup = new FormGroup({
    user: new FormControl<User>({ name: '' }),
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  createUser() {
    this.userService.createUser({
      ...this.form.controls['user'].getRawValue()
    }).subscribe({
      next: (result) => {
        console.log(`It worked! A new User was created!`);
        this.router.navigate(['../'], {relativeTo: this.route});

      },
      error: (error) => {
        console.error(`Oh No! It didn't work!:`, error);
      }
    });
  }
}
