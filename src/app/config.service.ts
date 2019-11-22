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
    // private url = this.globals.serverUrl + '/configs.json';
    private menuAPI = 'http://lucas.innest.co.kr/menu';
    private pType2API = 'http://lucas.innest.co.kr/partners/search/ptype2';
    private pType4API = 'http://lucas.innest.co.kr/partners/search/ptype4';
    private MaterialAPI = 'http://lucas.innest.co.kr/materials/search';
    private userAPI = 'http://lucas.innest.co.kr/users/list';

    /** GET data from the server */
    public getConfigData(apiURL, configKey) {
        return new Promise((resolve, reject) => {
            this.http.get(apiURL).subscribe((responseData) => {
                this.globals.configs[configKey] = responseData['data'];
                resolve(true);
                this.isCorrect = true;

            }, error => {
                console.log(error);
                resolve(false);
                this.isCorrect = false;
            });
        })
    }

    public load() {
        return this.getConfigData(this.menuAPI, 'menu')
            .then(() => this.getConfigData(this.pType2API, 'type2Partners'))
            .then(() => this.getConfigData(this.pType4API, 'type4Partners'))
            .then(() => this.getConfigData(this.MaterialAPI, 'schMaterials'))
            .then(() => this.getConfigData(this.userAPI, 'users'))
            .then(() => {
                console.warn(this.globals.configs['menu']);
                console.warn(this.globals.configs['type2Partners']);
                console.warn(this.globals.configs['type4Partners']);
                console.warn(this.globals.configs['schMaterials']);
                console.warn(this.globals.configs['users']);
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
