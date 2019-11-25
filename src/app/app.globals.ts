import { Injectable } from '@angular/core';
import { AppConfig } from '../environments/environment';
import { ServerConfig } from '../environments/serverinfo';

@Injectable()
export class AppGlobals {
    constructor() { }

    public remoteUrl: string = 'http://lucas.innest.co.kr';
    public serverUrl: string = this.getServerUrl();


    public userId: string = '';
    public userName: string = '';
    public userPosition: string = '';
    public userPermission: Object = null;
    public isDevIP: boolean = false;


    public configs: any[] = [];
    public tDate: string = this.convertDate();

    // 그리드 높이
    public gridHeight: number = window.innerHeight - 360;

    // 그리드 메세지
    public datatableMessages = {emptyMessage: '<div class="no-data">검색된 데이터가 없습니다.</div>'}

    // 권한없음 메세지
    public isNotExecutable: string = '실행 권한이 없습니다.';
    public isNotPrintable: string = '인쇄 권한이 없습니다.';

    //엑셀 생성관련
    public excelMasterPath: string = 'master';
    public headerFontStyle = {color: {argb: 'ff000000'}, size: 11, bold: true};
    public headerFillColor = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffb8cce4'}} ;
    public headerBorderStyle = {top: {style: 'hair'}, left: {style: 'hair'}, bottom: {style: 'hair'}, right: {style: 'hair'}};
    public headerAlignment = {horizontal: "center"};
    public bodyFontStyle = {color: {argb: 'ff000000'}, size: 10, bold: false};
    public bodyBorderStyle = {top: {style: 'hair'}, left: {style: 'hair'}, bottom: {style: 'hair'}, right: {style: 'hair'}};


    //테스트서버와 실제사용서버 구분
    getServerUrl() {
      if(!AppConfig.production){
        this.serverUrl = ServerConfig.myDevServer;
      }else{
        // this.serverUrl='http://idm.innest.co.kr';
        this.serverUrl='http://lucas.innest.co.kr';
      }
      return this.serverUrl;
    }

    convertDate() {
        var t = new Date();
        var y = t.getFullYear();
        var m = t.getMonth() + 1;
        var d = t.getDate();

        return y + '-' + this.numberToString(m) + '-' + this.numberToString(d);
    }

    numberToString(n) {
        var str: string;
        if (n < 10) {
            str = '0' + n;
        } else {
            str = String(n)
        }
        return str;
    }
}
