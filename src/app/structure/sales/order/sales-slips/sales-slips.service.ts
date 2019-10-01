import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './sales-slips.item';
import { AppGlobals } from '../../../../app.globals';

const httpOptions = {};

@Injectable()
export class SalesSlipsService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/sales/history/COMPLETION';

    /** GET data from the server */
    GetSalesCompletionAll (params): Observable<Item[]> {
        let currTime = (new Date()).getTime();
        return this.http.get<Item[]>(this.url + '?t=' + currTime, {params: params});
    }

    GetSlip (slipNo) {
        let currTime = (new Date()).getTime();
        return this.http.get(this.globals.serverUrl + '/slips/' + slipNo + '?t=' + currTime);
    }

    Save (data): Observable<Item> {
        return this.http.post<Item>(this.globals.serverUrl + '/sales/slips', data, httpOptions).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }

    /**
     * 실패한 Http 작업 처리
     * 프로그램은 계속 실행되도록 함.
     * @param operation - 실패한 작업명
     * @param result - observable 결과로 리턴할 선택적 값
     */
     private handleError<T> (operation = 'operation', result?: T) {
         return (error: any): Observable<T> => {

             // TODO: 원격 로깅 인프라에 에러 전송
             console.error(error); // 대신 콘솔에 로그 출력

             // TODO: 오류 변환을 더 좋게 처리
             this.log(`${operation} failed: ${error.message}`);

             // 프로그램이 계속 실행되도록 빈 결과를 리턴
             return of(result as T);
         };
     }

     /** 오류 로그 */
     private log(message: string) {
         console.log(message);
         //this.messageService.add('오류: ' + message);
     }

    GetExcelFile (): Observable<Blob> {
        return this.http.get(this.url + '/exceldown', {responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
    }
}
