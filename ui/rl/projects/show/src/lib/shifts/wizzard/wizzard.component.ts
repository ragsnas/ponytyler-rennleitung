import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { Show, ShowService } from "projects/backend-api/src/lib/show.service";
import { Shift, ShiftService } from "projects/backend-api/src/lib/shift.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";

@Component({
  selector: 'lib-wizzard',
  standalone: true,
  imports: [
    RouterOutlet,
  ],
  templateUrl: './wizzard.component.html',
  styleUrl: './wizzard.component.css'
})
export class WizzardComponent implements OnInit {
  showId: string | undefined;
  show$: Observable<Show> | undefined;
  show: Show | undefined;
  shifts$: Observable<Shift[]> | undefined;

  constructor(
    private showService: ShowService,
    private shiftService: ShiftService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.showId = this.route.snapshot.paramMap.get("showId") || undefined;
    if (this.showId) {
      this.show$ = this.showService.getShow(this.showId);
      this.show$?.subscribe({
        next: (show: Show) => {
          this.shifts$ = this.shiftService.getAllShiftsForShow(this.showId!);
          this.show = show;
        },
      });
    }
  }
}
