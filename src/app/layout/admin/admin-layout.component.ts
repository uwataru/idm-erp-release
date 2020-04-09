import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, Routes } from '@angular/router';
import { AppConfig } from '../../../environments/environment';
import { AppGlobals } from '../../app.globals';
import { UserService } from '../../user.service';
import { MessageService } from '../../message.service';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { Location } from '@angular/common';

//access reDirectTo
import { routes as sales_routes } from '../../structure/sales/sales.module';
import { routes as production_routes } from '../../structure/production/production.module';
import { routes as materials_routes } from '../../structure/materials/materials.module';
import { routes as technology_routes } from '../../structure/technology/technology.module';
import { routes as accounting_routes } from '../../structure/accounting/accounting.module';
import { routes as settings_routes } from '../../structure/settings/settings.module';
import { routes as personnel_routes } from '../../structure/personnel/personnel.module';
import { NgbTabTitle } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css'],
    providers: [UserService]
})

export class AdminLayoutComponent implements OnInit {
    title = 'IDM';
    version = AppConfig.VERSION;
    page_title: string = '메인';
    navitems = this.globals.configs['menu'];
    currentMenu: string;
    currentSubmenu: string;
    isAsideFolded: boolean = false;
    isAsideShow: boolean = false;
    isNavebarshow: boolean = false;
    userId: string = this.globals.userId;
    userName: string = this.globals.userName;
    userPosition: string = this.globals.userPosition;

    isDevMode = !AppConfig.production;
    isDevIP = this.globals.isDevIP;
    serverHostName = this.globals.serverUrl.substring(7, this.globals.serverUrl.indexOf("."));

    tabs: any[] = [];
    tmpTabs: any[] = [];

    constructor(
        private electronService: ElectronService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private globals: AppGlobals,
        private dataService: UserService,
        private titleService: Title,
        private location: Location,
        private messageService: MessageService
    ) {}

    removeTabHandler(tab: any): void {
        this.tmpTabs.splice(this.tmpTabs.indexOf(tab), 1);
    }
    
    createTab(no, path) {
        console.log("TAB : ",path);

        let existTabs = false;
        for(let i in this.tmpTabs) {
            if(this.tmpTabs[i].routerUrl.indexOf(path) !== -1) {
                existTabs = true;        
            }
        }
        if(this.electronService.isMobile == true){
            if(this.tmpTabs.length >= 6 && !existTabs) {
                this.removeTabHandler(this.tmpTabs[this.tmpTabs.length-1]);    
            }
        }else{
            if(this.tmpTabs.length >= 9 && !existTabs) {
               this.removeTabHandler(this.tmpTabs[this.tmpTabs.length-1]);    
            }
        }


        console.warn('existTabs= ', existTabs);
        if(existTabs == false) {

            let tabTitleLength = this.activatedRoute.snapshot.children[0].firstChild.data.title.split('>').length;
            let tabTitle = this.activatedRoute.snapshot.children[0].firstChild.data.title.split('>')[tabTitleLength-1];
            this.tmpTabs.unshift({
                no : no,                            
                title : tabTitle,
                routerUrl : path + '?tabs=1'
            });

            this.tabs = [];
            for(let i in this.tmpTabs) {
                this.tabs.push({
                    no : this.tmpTabs[i].no,                            
                    title : this.tmpTabs[i].title,
                    routerUrl : this.tmpTabs[i].routerUrl, 
                    removable : true,
                    customClass: 'ngxTab tabSub',
                    active : parseInt(i) == 0 ? true : false
                });
                console.warn('active= ', parseInt(i), this.tmpTabs[i]);
            }

        } else {
            for(let i in this.tabs) {
                console.warn('indexOf= ', this.tabs[i].routerUrl.indexOf(path));
                if(this.tabs[i].routerUrl.indexOf(path) !== -1) {
                    console.warn('active= ', this.tabs[i]);
                    this.tabs[i].active = true;          
                }
            }
        }
    }

    goToLink(no, path, reDirectTo=false) { 
        console.log('PATHPATH',no, path)

        setTimeout(() => {            
                
            let convUrl = new URL('http://www.innest.co.kr/'+path);
            if( !convUrl.searchParams.has('tabs')) {
                this.router.navigateByUrl('/refresh/load', {
                    skipLocationChange: true,
                }).then(
                    success => {
                        if(reDirectTo) {
                            let splitPath = path.split('/');
                            let strRouteName = splitPath[0] == '' ? splitPath[1] : splitPath[0];
                            let routeName: Routes;
                            switch(strRouteName) {
                                case 'sales':
                                    routeName = sales_routes;
                                break;
                                case 'production':
                                    routeName = production_routes;
                                break;
                                case 'personnel':
                                    routeName = personnel_routes;
                                    break;
                                case 'materials':
                                    routeName = materials_routes;
                                break;
                                case 'technology':
                                    routeName = technology_routes;
                                break;
                                case 'accounting':
                                    routeName = accounting_routes;
                                break;
                                case 'settings':
                                    routeName = settings_routes;
                                break;
                            }              
                            for(let i in routeName) {
                                if( routeName[i].redirectTo && path.replace(strRouteName,'').replace(/\//g,'') == routeName[i].path.replace(/\//g,'') ) {
                                    path = "/"+strRouteName+"/"+routeName[i].redirectTo;
                                }
                            }
                        } 
                        this.router.navigateByUrl(path).then(
                            success => {
                                console.log("PATH2 : ",path);
                                this.createTab(no,path);
                            }
                        );

                    },
                    fail => { this.messageService.add('error!!'); }
                );

            } else {      
                this.router.navigateByUrl(path);
            }
            
        }, 100);
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if ( event instanceof NavigationEnd ) {
                this.currentMenu = this.getActiveGroupMenu();
                this.currentSubmenu = this.router.url;
            }
        });

        this.router.events
        .filter((event) => event instanceof NavigationEnd)
        .map(() => this.activatedRoute)
        .map((route) => {
            while (route.firstChild) route = route.firstChild;
            return route;
        })
        .filter((route) => route.outlet === 'primary')
        .mergeMap((route) => route.data)
        .subscribe((event) => {
            this.titleService.setTitle(event['title']);
            this.page_title = event['title'];
        });
        this.goToLink(5,'/production',false);
    }

    getActiveGroupMenu() {
        let toArray = this.router.url.split('/');
        let ret = toArray[0] + '/' + toArray[1];
        if (ret == '/settings') {
            ret = ret + '/' + toArray[2];
        }
        return ret;
    }

    toggleButtonClick(target:string) {
        switch (target) {
            case 'app-aside-folded':
                this.isAsideFolded = this.isAsideFolded === true ? false : true;
            break;
            case 'app-aside':
                this.isAsideShow = this.isAsideShow === true ? false : true;
            break;
            case 'navbar-collapse':
                this.isNavebarshow = this.isNavebarshow === true ? false : true;
            break;
        }
    }

    Logout() {
        this.dataService.logout();
        this.router.navigate(['/auth/session']);
    }

    minimumWindow() {
        this.electronService.remote.getCurrentWindow().minimize();
    }

    closeWindow() {
        this.dataService.logout();
        this.electronService.exitApp();
    }
}
