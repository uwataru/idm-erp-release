import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Item } from './products.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class ProductsService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/products';

    GetAll (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url, {params: params});
    }

    GetExcelFile (type): Observable<Blob> {
        let myHeaders = new HttpHeaders();
        let u = type == true ? '/setexceldown' : '/exceldown'
        myHeaders.append('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return this.http.get(this.url + u, {headers: myHeaders, responseType: 'blob'}).pipe(
            tap((data: Blob) => console.log(data)),
            catchError(this.handleError<Blob>('Create'))
        );
    }

    GetById (id:number): Observable<Item> {
        return this.http.get<Item>(this.url+'/'+id);
    }

    GetByCode (code:string): Observable<Item> {
        return this.http.get<Item>(this.url+'/check/'+code);
    }

    //======= 저장 =======//
    /** POST: 데이터 추가 */
    Create (data) {
        return this.http.post(this.url, data).pipe(
            tap((data: Item) => this.log(`added data w/ id=${data}`)),
            catchError(this.handleError<Item>('Create'))
        );
    }
    private extractData(res: Response) {
	    let body = res.json();
        return body || {};
    }
    /** PUT: 데이터 수정 */
    Update (id:number, data) {
        return this.http.put(this.url+'/'+id, data);
    }

    /** PUT: 숨김,삭제 */
    changeStatus (id, data) {
        return this.http.put(this.url+'/status/'+id, data);
    }

    UploadExcelFile (data) {
        return this.http.post(this.url + '/excelupload', data)
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
