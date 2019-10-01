import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './materials-planning.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class MaterialsPlanningService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/production/materials-planning';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '?t=' + currTime, {params: params});
    }
    
    GetExcelFile () {
        let myHeaders = new HttpHeaders();
        myHeaders.append('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return this.http.get(this.url + '/exceldown', {headers: myHeaders, responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
    }

    GetPlanningDate () {
        let currTime = (new Date()).getTime();
        return this.http.get(this.globals.serverUrl + '/production/planning/get-plan-date?t=' + currTime);
    }

    changePlanningDate (data) {
        return this.http.post(this.url + '/change-plan-date', data).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }

    /** 순서 변경 */
    changeSeqNo (line, data) {
        return this.http.get(this.url + '/' + line + '/' + data);
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
