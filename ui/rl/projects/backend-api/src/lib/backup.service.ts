import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../../../src/environments/environment";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class BackupService {
  constructor(
    private http: HttpClient,
  ) {
  }

  isDownloadPossible(): Observable<boolean> {
    let isDownloadPossible$ = new Subject<boolean>();
    try {
      this.http.get<boolean>(`${environment.apiUrl}api/backup/download-possible`).subscribe(result => {
        console.log(`isDownloadPossible is now ${result}`);
        isDownloadPossible$.next(result);
      });
    } catch (e) {
      isDownloadPossible$.next(false);
    }
    return isDownloadPossible$.asObservable();
  }

}
