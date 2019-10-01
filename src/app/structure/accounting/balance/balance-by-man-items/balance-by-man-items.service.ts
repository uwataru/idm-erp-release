import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SumItem } from './balance-by-man-items.item';

@Injectable()
export class BalanceByManItemsService {

    private loadItemUrl = 'http://seil-erp.innest.co.kr/d/accounting/balance/balance-by-man-items?format=json';  // URL to web api

    constructor(private http: HttpClient) { }

    /** GET data from the server */
    loadData (): Observable<SumItem[]> {
        return this.http.jsonp<SumItem[]>(this.loadItemUrl, 'callback');
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
