import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './outsourced-storage.item';
import { AppGlobals } from '../../../../app.globals';

const httpOptions = {};

@Injectable()
export class OutsourcedStorageService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/outsourcing/orders';

    GetAll (): Observable<Item[]> {
        return this.http.get<Item[]>(this.url);
    }

    GetExcelFile (): Observable<Blob> {
        return this.http.get(this.url + '/storage/exceldown', {responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
    }

    GetById (pocNo:string): Observable<Item> {
        return this.http.get<Item>(this.url+'/'+pocNo);
    }

    GetPricePerUnit (partner:number, process:string): Observable<Item> {
        return this.http.get<Item>(this.url + '/price-per-unit/' + partner + '/' + process);
    }

    //======= 저장 =======//
    /** POST: 데이터 추가 */
    Create (data:Item): Observable<Item> {
        return this.http.post<Item>(this.url + '/receiving', data, httpOptions).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }

    GetOutsReceiving (id:string): Observable<Item> {
        return this.http.get<Item>(this.url + '/receiving-by-outsid/' + id);
    }

    Delete (id, data) {
        return this.http.put(this.url+'/delete/'+id, data);
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
}
