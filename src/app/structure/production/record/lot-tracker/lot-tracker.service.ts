import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Item } from './lot-tracker.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class LotTrackerService {

    constructor(private http: HttpClient, private globals: AppGlobals) { }

    private loadItemUrl = this.globals.remoteUrl + '/production/record/lot-tracker?format=json';

    /** GET data from the server */
    loadData (): Observable<Item[]> {
        return this.http.jsonp<Item[]>(this.loadItemUrl, 'callback');
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
