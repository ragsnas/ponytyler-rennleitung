import { Component, Inject, LOCALE_ID, OnInit, Renderer2 } from "@angular/core";
import { Show, ShowService } from "projects/backend-api/src/lib/show.service";
import { Observable, of, Subject } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { formatDate } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { BackendApiModule, BackupService } from "projects/backend-api/src/public-api";
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

  toggleActive(show: Show) {
    this.showService.updateShow({
      ...show,
      active: !show.active,
    }).subscribe({
      next: (result) => {
        console.log(`this worked`);
        this.shows$ = this.showService.getAllShows();
      },
      error: (error) => {
        this.snackBar.open(`Error during toggling of Show Status: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, announcementMessage: `Error`, panelClass: "error",
        });
      },
    });
  }

  toggleFinished(show: Show) {
    this.showService.updateShow({
      ...show,
      finished: !show.finished,
      active: (!show.finished) ? false : show.active,
    }).subscribe({
      next: (result) => {
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
