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

    private url = this.globals.serverUrl + '/production/plan/materials';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url, {params: params});
    }
    GetMaterialPlanningInfo(id){
        return this.http.get(this.url + '/' + id);
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
