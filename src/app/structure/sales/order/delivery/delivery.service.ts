import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './delivery.item';
import { AppGlobals } from '../../../../app.globals';
const httpOptions = {};

@Injectable()
export class DeliveryService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/sales/delivery/statement';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url, {params: params});
    }

    GetPaList (): Observable<Item[]> {
        return this.http.get<Item[]>(this.globals.serverUrl+'/partners/search?ptype=nptype2');
    }

    // postData
    statement (data): Observable<Item[]> {
        return this.http.post<Item[]>(this.globals.serverUrl+'/sales/delivery/statement', data, httpOptions).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
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

    private log(message: string) {
        console.log(message);
        //this.messageService.add('오류: ' + message);
    }
}
