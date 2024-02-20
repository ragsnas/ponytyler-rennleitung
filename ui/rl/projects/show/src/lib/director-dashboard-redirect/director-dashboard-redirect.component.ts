import { Component, OnInit } from '@angular/core';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';
import {Router} from "@angular/router";

@Component({
  selector: 'lib-director-dashboard-redirect',
  templateUrl: './director-dashboard-redirect.component.html',
  styleUrls: ['./director-dashboard-redirect.component.scss']
})
export class DirectorDashboardRedirectComponent implements OnInit {

  error: string | undefined;
  show: Show | undefined;

  constructor(
    private showService: ShowService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.showService.getCurrentShow()?.subscribe({
      next: (show: Show) => {
        this.show = show;
        this.router.navigate(['show', show.id?.toString(), 'director-dashboard'])
      },
      error: (error) => {
        this.error = error?.error?.message;
      }
    })
  }

}
