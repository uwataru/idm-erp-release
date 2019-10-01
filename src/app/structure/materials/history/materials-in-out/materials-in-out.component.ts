import { Component, EventEmitter, Output, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder,FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { saveAs as importedSaveAs } from "file-saver";
import { DatePipe } from '@angular/common';
import { MaterialsInOutService } from './materials-in-out.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { ElectronService} from '../../../../providers/electron.service';
import { MessageService } from '../../../../message.service';
import { Item } from './materials-in-out.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './materials-in-out.component.html',
    styleUrls: ['./materials-in-out.component.css'],
    providers: [MaterialsInOutService, DatePipe],
    encapsulation: ViewEncapsulation.None

})
export class MaterialsInOutComponent implements OnInit {

    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    searchForm: FormGroup;
    historyForm: FormGroup;
    
    isEditMode: boolean = false;
    isLoadingProgress: boolean = false;
    
    formData: Item[];
    searchValue: string;
    rows: Item['rowData'][];
    temp = [];
    listSltdPaCode: number = 0;
    listPartners: any[] = this.globals.configs['type2Partners'];

    listSltdMkCode: number = 0;
    listMakers: any[] = this.globals.configs['maker'];

    totalBalance: number;
    totalBalanceAmount: number;

    totalOrderAmount: number;
    totalRcvWeight: number;
    totalUsedWeight: number;
    totalUsedAmount: number;
    totalWeight: number;
    totalRemaingAmount: number;

    detailsTitle: string;

    detail_sch_sdate: string;
    detail_sch_edate: string;

    detailrows: Item['detailsData'];

    detail_material: string;
    detail_size: number;
    detail_steel_maker: string;
    detail_partner_name: string;


    detailsums_total_used_weight: number;
    detailsums_total_loss_weight: number;
    detailsums_total_rcv_weight: number;
    detailsums_total_remaining_weight: number;
    detailsums_production_qty: number;
    detailsums_forwarding_weight: number;
    detailsums_outsourcing_rcv_qty: number;
    detailsums_outsourcing_order_qty: number;
    detailsums_defective_qty: number;
    detailsums_screening_qty: number;
    detailsums_screening_defect_qty: number;
    detailsums_inventory_qty: number;

    messages = this.globals.datatableMessages;

    errorMessage: string;

    constructor(
        private fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: MaterialsInOutService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public electronService: ElectronService
    ) {
        this.historyForm = fb.group({
            sch_maker_name: '',
            sch_partner_name: ''
        });

        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            sch_material: '',
            sch_size: '',
            material_code: '',
            size: '',
            steel_maker_code: '',
            partner_code: ''
        });

        
        if( this.listPartners.filter(v => v.Code == 0).length < 1 ) {
            this.listPartners.unshift({Code:0, Name:'전체', Alias:'전체'});
        }

        if( this.listMakers.filter(v => v.Code == 0).length < 1 ) {
            this.listMakers.unshift({CfgCode:0, CfgName:'전체'});
        }

    }

    ngOnInit() {
        this.panelTitle = '원자재수불명세서';
        this.inputFormTitle = '원자재수불내역서';

        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    getAll(): void {
        let formData = this.searchForm.value;

        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sch_material: formData.sch_material,
            sch_size: formData.sch_size,
            sortby: ['rcv_date'],
            order: ['asc'],
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;

        /*
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        if (this.listSltdMkCode > 0 && formData.sch_maker_name != '') {
            params['maker_code'] = this.listSltdMkCode;
        }
        */


        this.dataService.GetAll(params).subscribe(
            data =>
            {
                this.rows = data['data'];
                this.temp = data['data'];

                this.totalBalance = data['totalBalance'];
                this.totalBalanceAmount = data['totalBalanceAmount'];

                this.totalOrderAmount = data['totalOrderAmount'];
                this.totalRcvWeight = data['totalRcvWeight'];
                this.totalUsedWeight = data['totalUsedWeight'];
                this.totalUsedAmount = data['totalUsedAmount'];
                this.totalWeight = data['totalWeight'];
                this.totalRemaingAmount = data['totalRemaingAmount']
                
                this.isLoadingProgress = false;
            } 
            
        );
       
    }

    excelDown() {
        let path = this.electronService.path;
        let app = this.electronService.remote.app;
        //let dialog = this.electronService.remote.dialog;
        //let toLocalPath = path.resolve(app.getPath("desktop"), "원자재마스터.xlsx");
        //let userChosenPath = dialog.showSaveDialog({ defaultPath: toLocalPath });

        //if (userChosenPath) {
        this.dataService.GetExcelFile().subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, "원자재수불명세서.xlsx");

                let win = this.electronService.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {
                    // Set the save path, making Electron not to prompt a save dialog.
                    //item.setSavePath('d:\project\원자재마스터.xlsx')
                    //item.setSavePath('d:\\project\\원자재마스터.xlsx');

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
                    })
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
            error => this.errorMessage = <any>error
        );
        //}
    }

    openModal(id) {

        // 검색폼 리셋
        // this.inputForm.reset();

        // POC No로 내역 조회
        

        let formData = this.searchForm.value;
        
        this.listSltdMkCode = 0;
        this.listSltdPaCode = 0;        
        this.historyForm.controls['sch_partner_name'].setValue('');
        this.historyForm.controls['sch_maker_name'].setValue('');

        let findRow: Item['rowData'];
        for (var i = 0; i<this.rows.length; i++ ){
            if(this.rows[i].id == id){
              findRow = this.rows[i]; 
            } 
        }
        let params = {
            id: id,
            //sch_prdline: formData.production_line,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            material_code: findRow.material_code,
            material: findRow.material,
            size: findRow.size,
            steel_maker_code: findRow.steel_maker_code,
            partner_code: findRow.partner_code,
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;
        
        this.dataService.GetDetails(params).subscribe(
            data =>
            {
                
                this.detailrows = data['data'];
                
                this.detailsums_total_used_weight= data['totalUsedWeight'];
                this.detailsums_total_loss_weight= data['totalLossWeight'];
                this.detailsums_total_rcv_weight = data['totalRcvWeight'];
                this.detailsums_total_remaining_weight = data['totalRemainingWeight'];

                this.isLoadingProgress = false;
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 250);
            }
            );
            
            this.detail_sch_sdate = this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd');
            this.detail_sch_edate = this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd');
            this.detail_material = findRow.material;
            this.detail_partner_name = findRow.partner_name;
            this.detail_size = findRow.size;
            this.detail_steel_maker = findRow.steel_maker;

    }


    getDetailRows() {

        let formData = this.searchForm.value;        
        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            material: this.detail_material,
            size:this.detail_size,
            steel_maker_code: this.listSltdMkCode,
            partner_code: this.listSltdPaCode,
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;
        
        this.dataService.GetDetails(params).subscribe(
        data =>
        {
            this.detailrows = data['data'];
            this.detailsums_total_used_weight= data['totalUsedWeight'];
            this.detailsums_total_loss_weight= data['totalLossWeight'];
            this.detailsums_total_rcv_weight = data['totalRcvWeight'];
            this.detailsums_total_remaining_weight = data['totalRemainingWeight'];
            this.isLoadingProgress = false;
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 250);
        }
        );
        
    }


    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['Code'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['Code'];
        }

        const val = this.listSltdPaCode;
        this.getDetailRows();

    }

    onSelectListMaker(event: TypeaheadMatch): void {
        if (event.item['CfgCode'] == '') {
            this.listSltdMkCode = 0;
        } else {
            this.listSltdMkCode = event.item['CfgCode'];
        }
        const val = this.listSltdMkCode;
        this.getDetailRows();
    }


}
