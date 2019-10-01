import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Item } from './accounting-closing.item';
import { AppGlobals } from '../../../../app.globals';

@Injectable()
export class AccountingClosingService {

    constructor(private http: HttpClient, private globals: AppGlobals) { }

    private url = this.globals.serverUrl + '/close/set-trial-balance';

    closeSave (params): Observable<Item[]> {
        return this.http.get<Item[]>(this.url, {params: params});
    }
    
}
