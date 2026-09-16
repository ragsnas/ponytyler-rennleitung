import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  constructor(private http: HttpClient) {}

  checkHealth(): Observable<HttpResponse<{ status: string }>> {
    return this.http.get<{ status: string }>(`${environment.apiUrl}api/health`, { observe: 'response' });
  }
}
