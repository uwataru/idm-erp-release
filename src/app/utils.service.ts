import {Injectable} from '@angular/core';

@Injectable()
export class UtilsService {

    calculDate(d:string, n:number): string {
        var arr = d.split('-');
        var dt = new Date(Number(arr[0]), Number(arr[1]), Number(arr[2]));
        var nd = new Date(new Date(dt).getTime() + (n*60*60*24*1000));

        var mm = nd.getMonth().toString();
        if (mm.length < 2) mm = '0' + mm;
        var dd = nd.getDate().toString();
        if (dd.length < 2) dd = '0' + dd;

        return nd.getFullYear() + '-' + mm + '-' + dd;
    }

    getFirstDate(d:string): string {
        var arr = d.split('-');
        return arr[0] + '-' + arr[1] + '-01';
    }

    getToday() {
        var t = new Date();
        var y = t.getFullYear();
        var m = t.getMonth() + 1;
        var d = t.getDate();

        return y + '-' + this.numberToString(m) + '-' + this.numberToString(d);
    }

    numberToString(n) {
        var str:string;
        if (n < 10) {
            str = '0' + n;
        } else {
            str = String(n);
        }
        return str;
    }

    addComma(n) {
        if (n < 1000) {
            return n;
        }
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    removeComma(n) {
        if ( !n ) {
            return 0;
        }
        if (n < 1000) {
            return n;
        }
        return n.replace(/[^\d.-]/g, '') * 1;
    }

}
