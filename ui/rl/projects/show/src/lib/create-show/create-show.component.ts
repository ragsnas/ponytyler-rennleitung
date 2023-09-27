import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowService } from 'projects/backend-api/src/lib/show.service';

@Component({
  selector: 'lib-create-show',
  templateUrl: './create-show.component.html',
  styleUrls: ['./create-show.component.css'],
})
export class CreateShowComponent {
  public form: FormGroup = new FormGroup({
    name: new FormControl(''),
  });

  constructor(private showService: ShowService, private router: Router, private route: ActivatedRoute) {

  }

  createShow() {
      this.showService.createShow(this.form.getRawValue()).subscribe({
        next: (result) => {
          console.log(`It worked:`, result);
          this.router.navigate(['..', result.id], {relativeTo: this.route});
        },
        error: (error) => {
          console.error(`Oh No! It didn't work!:`, error);
        }
      });;
  }
}
