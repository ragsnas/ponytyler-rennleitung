import { Component, Inject, LOCALE_ID, OnInit, Renderer2 } from "@angular/core";
import { Show, ShowService, ShowState } from "projects/backend-api/src/lib/show.service";
import { Observable, of } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { formatDate } from "@angular/common";
import { BackupService } from "projects/backend-api/src/public-api";
import { environment } from "../../../../../src/environments/environment";

@Component({
  selector: "lib-shows",
  templateUrl: "./shows.component.html",
  styleUrls: ["./shows.component.scss"],
})
export class ShowsComponent implements OnInit {
  shows$: Observable<Show[]> | undefined;
  downloadBackupPossible$: Observable<boolean> = of();

  constructor(
    private showService: ShowService,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private backupService: BackupService,

    @Inject(LOCALE_ID) public locale: string,
  ) {
  }

  ngOnInit(): void {
    this.shows$ = this.showService.getAllShows();
    this.downloadBackupPossible$ = this.backupService.isDownloadPossible();
  }

  startShow(show: Show): void {
    this.showService.updateShow({
      ...show,
      active: true,
      showState: ShowState.BEFORE_RACE,
      finished: false
    }).subscribe({
      next: () => {
        this.shows$ = this.showService.getAllShows();
      },
      error: (error) => {
        this.snackBar.open(`Error staarting Show: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, announcementMessage: `Error`, panelClass: "error",
        });
      },
    });
  }

  stopShow(show: Show): void {
    this.showService.updateShow({
      ...show,
      active: false,
      showState: ShowState.SHOW_FINISHED,
      finished: true
    }).subscribe({
      next: () => {
        this.shows$ = this.showService.getAllShows();
      },
      error: (error) => {
        this.snackBar.open(`Error staarting Show: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, announcementMessage: `Error`, panelClass: "error",
        });
      },
    });
  }

  setFinished(show: Show) {
    this.showService.updateShow({
      ...show,
      finished: true,
      active: false,
      showState: ShowState.SHOW_FINISHED
    }).subscribe({
      next: () => {
        this.shows$ = this.showService.getAllShows();
      },
      error: (error) => {
        this.snackBar.open(`Error during toggling of Show Status: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, announcementMessage: `Error`, panelClass: "error",
        });
      },
    });
  }

  downloadDatabaseBackup() {
    const link = this.renderer.createElement("a");
    link.setAttribute("target", "_blank");

    link.setAttribute("href", `${environment.apiUrl}api/backup/download`);
    link.setAttribute(
      "download",
      `rl-backup_download_${formatDate(new Date(), "YYYY-MM-dd_HH-mm-ss-SSS", this.locale)}.db`,
    );
    link.click();
    link.remove();
  }

  uploadDatabaseBackup(event: Event) {
    console.log(`uploadDatabaseBackup: `, event);
    const target = event.target as HTMLInputElement;
    if (target?.files) {
      const files: FileList = target.files;
      console.log(`filesChanged:`, files);

    }
  }
}
