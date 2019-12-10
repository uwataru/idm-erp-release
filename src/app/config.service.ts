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
    private menuAPI = this.globals.serverUrl+ '/menu';
    private partnerAPI = this.globals.serverUrl+'/partners/search';
    private pType2API = this.globals.serverUrl+'/partners/search/ptype2';
    private pType4API = this.globals.serverUrl+'/partners/search/ptype4';
    private MaterialAPI = this.globals.serverUrl+'/materials/search';
    private userAPI = this.globals.serverUrl+'/users/list';
    private processAPI = this.globals.serverUrl+'/production/process/search';
    private productAPI = this.globals.serverUrl+'/products/search';
    private workLineAPI = this.globals.serverUrl+'/production/worklines/search';
    private correctionReasonAPI = this.globals.serverUrl+'/settings/search/correction_reason';
    private affiliationAPI = this.globals.serverUrl+'/settings/search/affiliation';
    private personnelAPI = this.globals.serverUrl+'/production/personnel/search';
    private defectAPI = this.globals.serverUrl+'/settings/search/defect_content';
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

    public load() {     //todo 재질, 제품등은 해당 페이지 생성시 재로딩해서 사용하도록 수정
        return this.getConfigData(this.menuAPI, 'menu')
            .then(() => this.getConfigData(this.partnerAPI, 'partnerList'))
            .then(() => this.getConfigData(this.MaterialAPI, 'schMaterials'))
            .then(() => this.getConfigData(this.userAPI, 'users'))
            .then(() => this.getConfigData(this.processAPI, 'processList'))
            .then(() => this.getConfigData(this.productAPI, 'productList'))
            .then(() => this.getConfigData(this.workLineAPI, 'productionLine'))
            .then(() => this.getConfigData(this.correctionReasonAPI, 'correctionReasonList'))
            .then(() => this.getConfigData(this.affiliationAPI, 'affiliationList'))
            .then(() => this.getConfigData(this.personnelAPI, 'personnelList'))
            .then(() => this.getConfigData(this.defectAPI, 'defectList'))
            .then(() => {
                console.warn(this.globals.configs['menu']);
                console.warn(this.globals.configs['type1Partners']);
                console.warn(this.globals.configs['type2Partners']);
                console.warn(this.globals.configs['type4Partners']);
                console.warn(this.globals.configs['schMaterials']);
                console.warn(this.globals.configs['users']);
                console.warn(this.globals.configs['processList']);
                console.warn(this.globals.configs['productList']);
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
