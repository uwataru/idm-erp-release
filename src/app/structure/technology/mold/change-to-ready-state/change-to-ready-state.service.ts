import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item, moldItem } from './change-to-ready-state.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class ChangeToReadyStateService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/production/planning';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '/?t=' + currTime, {params: params});
    }

    GetExcelFile (): Observable<Blob> {
        return this.http.get(this.url + '/ready/exceldown', {responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
    }

    GetProductInfo (id:number): Observable<Item> {
        return this.http.get<Item>(this.globals.serverUrl + '/products/code/' + id);
    }

    GetMoldInfo (params): Observable<moldItem[]> {
        return this.http.get<moldItem[]>(this.globals.serverUrl + '/technology/molds', {params: params});
    }

    /** PUT: 금형선택 */
    SelectMold (id:number, data) {
        return this.http.put(this.url+'/select-mold/'+id, data);
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
