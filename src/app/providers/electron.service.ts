import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote } from 'electron';
import * as childProcess from 'child_process';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { saveAs as importedSaveAs } from "file-saver";
import { catchError, tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';
import {AppConfig} from '../../environments/environment';
import {AuthGuard} from '../app.auth';
import { AppGlobals } from '../app.globals';
import { request } from 'http';
import { browser } from 'protractor';

export enum PRINT_MODE{
  MAIN = 'main',
  WORKER = 'worker'
}
export enum PRINT_OPT{
  LANDSCAPE = 'landscape'
}
export enum EXPORT_EXCEL_MODE{
    MASTER = 'master',
    LIST = 'list'
}

@Injectable()
export class ElectronService {
    public readonly PRINT_MODE = PRINT_MODE;
    public readonly PRINT_OPT = PRINT_OPT;
    public readonly EXPORT_EXCEL_MODE = EXPORT_EXCEL_MODE;
    public isMobile: boolean = false;

    ipcRenderer: typeof ipcRenderer;
    webFrame: typeof webFrame;
    remote: typeof remote;
    childProcess: typeof childProcess;
    fs: typeof fs;
    path: typeof path;

    constructor(
        private http: HttpClient,
        private globals: AppGlobals,
        private authGuard: AuthGuard
    ) {
        // Conditional imports
        if (this.isElectron()) {
            this.ipcRenderer = window.require('electron').ipcRenderer;
            this.webFrame = window.require('electron').webFrame;
            this.remote = window.require('electron').remote;

            this.childProcess = window.require('child_process');
            this.fs = window.require('fs');
            this.path = window.require('path');

            //ipcMain 로그 출력용
            ipcRenderer.on('ipcMain-log', (event, result) => {
                console.log("from ipcMain ==>>", result);
            });
        }
        this.mobileCheck();
    }

    isElectron = () => {
        return window && window.process && window.process.type;
    };


    GetExcelFile (opt,path): Observable<Blob> {
        let myHeaders = new HttpHeaders();
        let u = opt == EXPORT_EXCEL_MODE.MASTER ? '/setexceldown' : '/exceldown'
        myHeaders.append('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        console.log("path!!!!!!!!!!!!!"+this.globals.serverUrl+path);
        return this.http.get(this.globals.serverUrl+path + u, {headers: myHeaders, responseType: 'blob'}).pipe(
          tap((data: Blob) => console.log(data)),
        //   catchError(this.handleError<Blob>('Create'))
        );
      }

    public excelDL(opt='',path='',title=''): void {
        this.GetExcelFile(opt, path).subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, title);
                // else importedSaveAs(res, "수주등록현황.xlsx");

                let win = this.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {

                    const filename = item.getFilename();

                    item.on('updated', (event, state) => {
                        if (state === 'interrupted') {
                            console.log('Download is interrupted but can be resumed')
                        } else if (state === 'progressing') {
                            if (item.isPaused()) {
                                console.log('Download is paused')
                            } else {
                                console.log(`Received bytes: ${item.getReceivedBytes()}`)
                            }
                        }
                    });
                    item.once('done', (event, state) => {
                        if (state === 'completed') {
                            console.log(filename + ' 저장 완료');
                        } else {
                            alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
                            console.log(`Download failed: ${state}`)
                        }
                    })
                });
            },
            // error => this.errorMessage = <any>error
        );
    }

    public checkExportExcel() {
        if(this.isMobile==true){
            alert("pc에서 지원되는 기능입니다.");
            return false;
        }
        return true;
    }

    public readyPrint(target, printMode = '', opt = ''): void {
        if(this.authGuard.isPrintable == false){
            alert(this.globals.isNotPrintable);
        }
        else {
            if(this.isMobile==true){
                alert("pc에서 지원되는 기능입니다.")
            }else{
                let etc = {
                    setPageSize: undefined,
                    setPageMargin: undefined,
                    isSilent: true,
                    backupData: undefined,
                };
        
                if (opt == PRINT_OPT.LANDSCAPE) {
                    etc.setPageSize = 'A4 landscape';
                    etc.setPageMargin = '0.3cm';
                    etc.isSilent = false;
                    alert("인쇄 방향(레이아웃)을 '가로'로 변경 후 인쇄 해주세요.");
                }
        
                if (printMode == PRINT_MODE.MAIN) {   //메인윈도우에서 인쇄(엘리멘트 복사 없음!)
                    this.startPrint(printMode, '', '', etc);
                } else {   //워커윈도우에서 인쇄(엘리멘트 복사)
                    let headContent = document.getElementsByTagName('head')[0].innerHTML;
                    if (AppConfig.production) {
                        headContent = headContent.replace('<link rel="stylesheet" href="', '<link rel="stylesheet" href="../../dist/');
                    }
                    let cloneEl = document.getElementById(target).innerHTML;
        
                    //target의 input, select 태그 value 저장
                    let backupValues = {};
                    let selectEls = document.querySelectorAll('#' + target + ' input, #' + target + ' select') as any as Array<HTMLElement>;
                    selectEls.forEach(function (el) {
                        backupValues[el.id] = (el as HTMLInputElement).value;
                    });
                    etc.backupData = backupValues;
        
                    this.startPrint(printMode, headContent, cloneEl, etc);
                }
            }
        }
    }
    
    startPrint(printMode, head, el, etc): void {
        let printData = {
            type: 'print',
            head: head,
            el: el,
            etc: etc
        };
        if (printMode == PRINT_MODE.MAIN) {
            printData.type = 'printByMain';
        } else {
            printData.type = 'printByWorker';
        }

        // console.log(printData);
        ipcRenderer.send('request-mainprocess-action', printData);
    }

    public setDevTool(): void{
        //개발자도구
        if ((AppConfig.production == false || this.globals.isDevIP) && this.isMobile == false) {
            remote.globalShortcut.register('Control+Shift+D', () => {
                remote.BrowserWindow.getFocusedWindow().webContents.openDevTools()
            });
            window.addEventListener('beforeunload', () => {
                remote.globalShortcut.unregisterAll()
            });
        }
    }

    mobileCheck(): void {
        let UserAgent = navigator.userAgent;
        this.isMobile = UserAgent.match(/iPhone|iPod|iPad|Android|lgtelecom|nokia|SonyEricsson/i) != null
            || UserAgent.match(/LG|SAMSUNG|Samsung/) != null;
         // alert(navigator.userAgent);
    }

    public exitApp(): void {
        if (this.isMobile == false) {
            this.remote.getCurrentWindow().close();
        } else {
            // @ts-ignore
            WebviewChannel.postMessage('exitApp');
        }
    }

}



