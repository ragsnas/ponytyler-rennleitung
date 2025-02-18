import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "src/environments/environment";

export interface User {
  id?: number
  name: string
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  users$: Observable<User[]> = new BehaviorSubject([]);

  constructor(private http: HttpClient) {
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}api/user`).pipe(result => {
      return result

    });
  }

  getUser(userId: string | null): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}api/user/${userId}`).pipe(result => {
      return result
    });

  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}api/user`, user);
  }

  updateUser(user: User) {
    return this.http.patch(`${environment.apiUrl}api/user/${user.id}`, user);
  }
}
