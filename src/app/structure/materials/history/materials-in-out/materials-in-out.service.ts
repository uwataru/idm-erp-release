import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Item } from './materials-in-out.item';
import { AppGlobals } from '../../../../app.globals';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class MaterialsInOutService {

    constructor(private http: HttpClient, private globals: AppGlobals) { }

    private url = this.globals.serverUrl  + '/materials/history/materials-in-out';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '?t=' + currTime, {params: params});
    }

    GetDetails (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '/details?t=' + currTime, {params: params});
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
}
