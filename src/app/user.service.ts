import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { AppGlobals } from './app.globals';

export class User {
    user_id: string;
    user_name: string;
    user_type: string;
    user_betting_amount: number;
    token: string;
}

@Injectable()
export class UserService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/users/';

    public login(param) {
        let currTime = (new Date()).getTime();
        return this.http.post<User>(this.url + 'login?t=' + currTime, param).pipe(
            tap((data: User) => this.log(`login w/ id=${data}`)),
            catchError(this.handleError<User>('Login'))
        );
    }

    public logout() {
        // remove user from local storage to log user out
        sessionStorage.removeItem('currentUser');
    }

    CheckPasswd (param) {
        return this.http.post(this.globals.remoteUrl + 'check-passwd', param);
    }

    GetById (id:number) {
        return this.http.get(this.globals.remoteUrl + id);
    }

    /** PUT: 데이터 수정 */
    Update (id:number, data) {
        return this.http.put(this.globals.remoteUrl+'/stores/'+id, data);
    }

   /**
    * Handle Http operation that failed.
    * Let the app continue.
    * @param operation - name of the operation that failed
    * @param result - optional value to return as the observable result
    */
    private handleError<T> (operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {

            // TODO: send the error to remote logging infrastructure
            console.error(error); // log to console instead

            // TODO: better job of transforming error for user consumption
            //this.log(`${operation} failed: ${error.message}`);

            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

    /** 오류 로그 */
    private log(message: string) {
        console.log(message);
        //this.messageService.add('오류: ' + message);
    }
}
