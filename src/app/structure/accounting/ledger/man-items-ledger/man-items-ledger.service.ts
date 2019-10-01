import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './man-items-ledger.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class manItemsLedgerService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/ledger/man-items-ledger';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url, {params: params});
    }

    GetMgmtItems(acct_code:string): Observable<Item> {
        return this.http.get<Item>(this.globals.serverUrl + '/accounts/mgmt-items-by-account/' + acct_code);
    }

    GetMgmtItemValues(params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url+'/get-mgmt-item-values', {params: params});
    }

    GetExcelFile (): Observable<Blob> {
        return this.http.get(this.url + '/exceldown', {responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
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
