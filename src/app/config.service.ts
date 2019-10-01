import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppGlobals } from './app.globals';

@Injectable()
export class ConfigService {

    constructor(
        private http: HttpClient,
        private globals: AppGlobals
        ) { }
    public isCorrect : boolean;
    private currTime = (new Date()).getTime();
    private url = this.globals.serverUrl + '/configs.json';

    /** GET data from the server */
    public load() {
        return new Promise((resolve, reject) => {
            this.http.get(this.url+'?t='+this.currTime).subscribe((responseData) => {
                this.globals.configs = responseData;
                resolve(true);
                this.isCorrect = true;
                
            },
            error => {
                console.log(error);
                resolve(false);
                this.isCorrect = false;
                // if(confirm('Error \n 확인을 누르면 기존 페이지로 넘어갑니다')){
                //    // this.router.navigate (['/page-not-found']);
                // };
            });

        });
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

    /*
    public getConfig(key: any) {
        return this.globals.configs[key];
    }
    */
}
