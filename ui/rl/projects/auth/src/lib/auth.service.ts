import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUserValue: any;
  currentUserSubject: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return {};
  }
  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
