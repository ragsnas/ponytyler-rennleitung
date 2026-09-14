import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUserValue: unknown;
  currentUserSubject: Subject<unknown> = new Subject<unknown>();

  constructor(private http: HttpClient) {}

  login() {
    return {};
  }
  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
