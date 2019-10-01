import { Injectable } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Item } from './outsourcing-in-out.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class OutsourcingInOutService {

    constructor(private http: HttpClient, private globals: AppGlobals) { }

    private url = this.globals.serverUrl +  '/materials/history/outsourcing-in-out';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url , {params: params});
    }
    GetExcelFile (): Observable<Blob> {
        return this.http.get(this.url + '/exceldown', {responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
    }
    GetDetails (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '/details' , {params: params});
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
