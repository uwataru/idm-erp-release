import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { detailsItem } from './self-details.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class SelfDetailsService {

    constructor(private http: HttpClient, private globals: AppGlobals) { }

    private loadItemUrl = this.globals.remoteUrl + '/sales/order/self-details?format=json';

    /** GET data from the server */
    loadData (): Observable<detailsItem[]> {
        return this.http.jsonp<detailsItem[]>(this.loadItemUrl, 'callback');
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
