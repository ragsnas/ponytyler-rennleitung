import { Component, OnInit } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Observable } from "rxjs";
import { Show, ShowService } from "projects/backend-api/src/lib/show.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Shift, ShiftService } from "projects/backend-api/src/lib/shift.service";
import { info } from "ng-packagr/lib/utils/log";

@Component({
  selector: "lib-dashboard",
  templateUrl: "./shifts-dashboard.component.html",
  styleUrl: "./shifts-dashboard.component.scss",
})
export class ShiftsDashboardComponent implements OnInit {

  showId: string | undefined;
  show$: Observable<Show> | undefined;
  shifts$: Observable<Shift[]> | undefined;
  shifts: Shift[] | undefined;
  show: Show | undefined;

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
