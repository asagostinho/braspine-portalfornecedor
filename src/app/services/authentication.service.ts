import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Token } from '../models/token';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private urlpost = '/rest/api/oauth2/v1/token'; //url autentication

    private currentUserSubject: BehaviorSubject<Token>;
    public currentUser: Observable<Token>;

    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<Token>(JSON.parse(localStorage.getItem('currentUser') ?? 'null'));
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): Token {
        return this.currentUserSubject.value;
    }

    token(username: string, password: string) {


        // const config: any = localStorage.getItem('config');

        // let username: string = '';
        // let password: string = '';

        // if (config && config.userapi) {
        //   username = config.userapi.login;
        //   password = environment.password;
        // }

        console.log(environment.domain);
        let parampost = '?grant_type=password&password='+password+'&username='+username;
        return  this.http.post<any>(`${environment.domain}`+this.urlpost+parampost, { username, password })
            .pipe(map(token => {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                console.log(JSON.stringify(token));
                localStorage.setItem('currentUser', JSON.stringify(token));
                this.currentUserSubject.next(token);
                return token;
            }));

    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next({} as Token);
    }
}
