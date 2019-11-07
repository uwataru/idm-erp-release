import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { request } from 'request';
import { DomSanitizer } from '@angular/platform-browser';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { MaterialsService } from './materials.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../../message.service';
import { Item, PartnerItem } from './materials.item';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css'],
  providers: [MaterialsService, DatePipe]
})
export class MaterialsComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    statusFormTitle: string;
    statusConfirmMsg: string;
    statusConfirmBtn: string;
    statusFormValue: number;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    deleteConfirmMsg: string;
    hideConfirmMsg: string;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['type2Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_material: string;
    sch_st: number;
    st: number;
    rows = [];
    temp = [];
    delId = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type2Partners'];
    editData: Item;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('StatusFormModal') statusFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        private electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private sanitizer: DomSanitizer,
        private dataService: MaterialsService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private datePipe: DatePipe,
        private messageService: MessageService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
            if (route.routeConfig.data.id in this.globals.userPermission) {
                if (this.globals.userPermission[route.routeConfig.data.id]['executive_auth'] == true) {
                    this.isExecutable = true;
                }
                if (this.globals.userPermission[route.routeConfig.data.id]['print_auth'] == true) {
                    this.isPrintable = true;
                }
            }
        }

        this.searchForm = fb.group({
            sch_partner_name: '',
            sch_material: ''
        });
        this.inputForm = fb.group({
            input_date: ['', Validators.required],
            material: ['', Validators.required],
            material_type: ['', Validators.required],
            size: ['', Validators.required],
            partner_name: ['', Validators.required],
            partner_code: ['', Validators.required],
            price: ['', Validators.required],
            price_date: ['', Validators.required],
        });
    }

    ngOnInit() {
        this.panelTitle = '원자재물품 현황';
        this.inputFormTitle = '자재 등록';
        this.uploadFormTitle = '자재 엑셀업로드';
        this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
        this.hideConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';

        this.changeSubMenu(1);

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    changeSubMenu(st): void {
        this.sch_st = st;
        this.getAll();
    }

    onSelect({ selected }) {
        // console.log('Select Event', selected, this.selected);

        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }

    getAll(): void {
        this.selected = [];

        let formData = this.searchForm.value;
        let params = {
            //partner_name: formData.sch_partner_name,
            material: formData.sch_material,
            st: this.sch_st,
            sortby: ['material_name','size'],
            order: ['asc','asc'],
            maxResultCount: 10000
        }
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.temp = listData['data'];
                this.rows = listData['data'];

                // 제품 목록에서 거래처 추출
                // let pcodes = [];
                // var temp = [];
                // temp['Code'] = '';
                // temp['Name'] = '　';
                // this.listPartners[0] = temp;
                // var n = 1;
                // for (var i=0; i<this.rows.length; i++) {
                //     var temp = [];
                //     temp['Code'] = this.rows[i]['partner_code'];
                //     temp['Name'] = this.rows[i]['partner_name'];
                //
                //     if (pcodes.indexOf(temp['Code']) == -1 && this.rows[i]['partner_name'] != '') {
                //         pcodes.push(this.rows[i]['partner_code']);
                //         this.listPartners[n] = temp;
                //         n++;
                //     }
                // }

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListPartner(event: TypeaheadMatch): void {

        if (event.item['Code'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['Code'];
        }

        let partner_code = this.listSltdPaCode;
        let formData = this.searchForm.value;
        let material = formData.sch_material;

        let rt = this.temp.filter(function(d){
            d.partner_code = String(d.partner_code);
            return (d.partner_code.indexOf(partner_code) !== -1 && d.material.indexOf(material) !== -1) || !partner_code && !material;
        });

        this.rows = rt;
    }

    updateFilter(event) {

        let material = event.target.value;
        let partner_code = this.listSltdPaCode;

        let rt = this.temp.filter(function(d){
            return (d.material.indexOf(material) !== -1 && d.partner_code.indexOf(partner_code) !== -1) || !material && !partner_code;
        });

        this.rows = rt;
    }


    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        input_date: this.formData.input_date,
                        material: this.formData.material,
                        material_type: this.formData.material_type,
                        size: this.formData.size,
                        partner_name: this.formData.partner_name,
                        partner_code: this.formData.partner_code,
                        price: this.formData.price,
                        price_date: this.formData.price_date,
                    });
                }
            }
        );
    }

    Save () {
         let formData = this.inputForm.value;

         formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');
         formData.price_date = this.datePipe.transform(formData.price_date, 'yyyy-MM-dd');

         if (this.isEditMode == true) {
             this.Update(this.selectedId, formData);
         } else {
             formData.st = '1';
             this.Create(formData);
         }
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    Update (id, data): void {
        this.dataService.Update(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.getAll();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    changeStatus (id, st): void {
        const formData: FormData = new FormData();
        formData.append('st', st);
        this.dataService.changeStatus(id, formData)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.selectedId = '';
                    this.selected = [];
                    this.statusFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method, id) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'delete' || method == 'hide' || method == 'use') {
                this.statusFormModal.show();
            } else if (method == 'write') {
                this.inputFormModal.show();
            } else if (method == 'upload') {
                this.uploadFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        switch (method) {
            case 'delete':
                this.statusFormTitle = '자재 삭제';
                this.statusFormValue = -1;
                this.statusConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
            break;
            case 'hide':
                this.statusFormTitle = '자재 숨김';
                this.statusFormValue = 0;
                this.statusConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';
            break;
            case 'use':
                this.statusFormTitle = '자재 사용';
                this.statusFormValue = 1;
                this.statusConfirmMsg = '선택하신 데이터를 사용처리하시겠습니까?';
            break;
        }
        if (id) {
            if (id == 'selected') {
                let idArr = [];
                this.selected.forEach((e:any) => {
                    idArr.push(e.id);
                });
                this.selectedId = idArr.join(',');
            } else {
                this.selectedId = id;
            }
        }
        if (method == 'write') {
            if (id) {
                this.isEditMode = true;
                this.Edit(id);
            } else {
                this.inputForm.reset();
                this.inputForm.controls['input_date'].setValue(this.tDate);
                this.inputForm.controls['price_date'].setValue(this.tDate);
                this.isEditMode = false;
            }
        }
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
                importedSaveAs(res, "원자재마스터.xlsx");

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
                            this.uploadFormModal.hide();
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

    fileSelected (event) {
        let fileList: FileList = event.target.files;
        if(fileList.length > 0) {
            let file: File = fileList[0];
            let formData:FormData = new FormData();
            formData.append('uploadFile', file, file.name);

            this.excelUpload(formData);
        }
    }

    excelUpload (data): void {
        this.isLoadingProgress = true;
        this.dataService.UploadExcelFile(data).subscribe(
            data => {
                if (data['result'] == "success") {
                    this.inputForm.reset();
                    this.getAll();
                    this.messageService.add(this.editOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.uploadFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
    }

}
