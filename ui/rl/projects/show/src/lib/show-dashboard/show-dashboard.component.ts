import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Show, ShowService } from 'projects/backend-api/src/lib/show.service';

@Component({
  selector: 'lib-show-dashboard',
  templateUrl: './show-dashboard.component.html',
  styleUrls: ['./show-dashboard.component.css']
})
export class ShowDashboardComponent implements OnInit {

  show: Show | undefined;

  constructor(
    private showService: ShowService,
    private route: ActivatedRoute
    ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      if (params.get('showId')) {
        this.showService.getShow(params.get('showId') as string).subscribe(show => this.show = show);
      }
    });
  }

}
