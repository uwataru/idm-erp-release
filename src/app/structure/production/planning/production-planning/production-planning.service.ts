import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './production-planning.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class ProductionPlanningService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/production/planning';

    /** GET data from the server */
    GetAll (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '?t=' + currTime, {params: params});
    }

    GetPlanningDate () {
        let currTime = (new Date()).getTime();
        return this.http.get(this.url + '/get-plan-date?t=' + currTime);
    }

    changePlanningDate (data) {
        return this.http.post(this.url + '/change-plan-date', data).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }

    orderSave (data) {
        return this.http.post(this.url + '/order-save', data).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }


    outsForgingCreate (id, data:Item): Observable<Item> {
        return this.http.post<Item>(this.globals.serverUrl+ '/outsourcing/orders/outs-forging-products/'+id, data).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }

    ResetSeqNo (data) {
        return this.http.post(this.url + '/reset-seq-no', data).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }

    GetPlanningInfo(id) {
        let currTime = (new Date()).getTime();
        return this.http.get(this.url + '/get-planning-info/' + id + '?t=' + currTime);
    }

    GetOrdersAdjustment (id) {
        let currTime = (new Date()).getTime();
        return this.http.get(this.url + '/get-orders-adjustment/' + id + '?t=' + currTime);
    }

    GetCuttingWorkAllocation (pocNo:string) {
        let currTime = (new Date()).getTime();
        return this.http.get(this.globals.serverUrl + '/production/assembly-works/' + pocNo + '?t=' + currTime);
    }

    GetForgingWorkAllocation (fwoNo:string): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.globals.serverUrl + '/production/forging-works/' + fwoNo + '?t=' + currTime);
    }

    GetMaterialsReceiving (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.globals.serverUrl + '/materials/receiving', {params: params});
    }

    /** 순서 변경 */
    changeSeqNo (line, data) {
        return this.http.get(this.url + '/' + line + '/' + data);
    }

    /** 라인변경 */
    ChangeProductionLine (id:number, data) {
        return this.http.put(this.url + '/change-line/' + id, data);
    }

    /** PUT: 데이터 수정 */
    Update (id:number, data) {
        return this.http.post(this.url + '/update/' + id, data);
    }

    /** PUT: 숨김,삭제 */
    Delete (id, data) {
        return this.http.put(this.url+'/delete/'+id, data);
    }

    CreatePrintView (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url, {params: params});
    }

    CreateForgingOrder () {
        return this.http.get(this.url + '/forging');
    }

    CreateCuttingOrder (id, data) {
        return this.http.post(this.url + '/assembly/' + id, data).pipe(
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

    /** 오류 로그 */
    private log(message: string) {
        console.log(message);
        //this.messageService.add('오류: ' + message);
    }
}
