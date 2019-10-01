import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { HeatingPriceService } from './heating-price.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { MessageService } from '../../../../message.service';
import { Item } from './heating-price.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './heating-price.component.html',
    styleUrls: ['./heating-price.component.scss'],
    providers: [HeatingPriceService]
})

export class HeatingPriceComponent implements OnInit {
    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    deleteConfirmMsg: string;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;
    editData: Item;
    formData: Item['data'];
    partnersArray = [];
    processArray = [];
    priceData = [];
    delId = [];
    selected = [];

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type43Partners'];
    inputSltdPaCode: number = 0;
    heatingProcess: any[] = this.globals.configs['heatingProcess'];

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: HeatingPriceService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private configService: ConfigService,
        private messageService: MessageService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
            if (route.routeConfig.data.id in this.globals.userPermission) {
                console.log(route.routeConfig.data.id);
                if (this.globals.userPermission[route.routeConfig.data.id]['executive_auth'] == true) {
                    this.isExecutable = true;
                }
                if (this.globals.userPermission[route.routeConfig.data.id]['print_auth'] == true) {
                    this.isPrintable = true;
                }
            }
        }

        this.inputForm = fb.group({
            partner_name: ['', [Validators.required]],
            partner_code: ['', [Validators.required]]
        });

        this.heatingProcess.forEach((code) => {
            this.inputForm.addControl(code.CfgCode + '_price', new FormControl(['', [Validators.required]]));
        })
    }

    ngOnInit() {
        this.panelTitle = '열처리단가';
        this.inputFormTitle = '열처리단가 등록';
        this.deleteFormTitle = '열처리단가 삭제';
        this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

        this.GetAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    GetAll(): void {
        this.partnersArray = [];
        this.priceData = [];
        let params = {
            sortby: ['cfg_code'],
            order: ['asc'],
            maxResultCount: 10000
        }
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                let priceArray = []
                let partnerCodeArray = [];
                for (let p in this.listData['price']) {
                    let d = p.split('-');
                    let partnerCode = d[0];
                    let partnerName = d[1];
                    let process = d[2];

                    if (partnerCodeArray.indexOf(partnerCode) < 0) {
                        partnerCodeArray.push(partnerCode);
                        this.partnersArray.push({name:partnerName, code:partnerCode});
                        priceArray[partnerCode] = [];
                    }
                    if (this.processArray.indexOf(process) < 0) {
                        this.processArray.push(process);
                    }
                    priceArray[partnerCode].push(this.listData['price'][p]);
                }
                this.partnersArray.sort();
                this.partnersArray.forEach((partner) => {
                    this.priceData.push({
                        'code': partner.code,
                        'name': partner.name,
                        'price': priceArray[partner.code]
                    });
                })

                console.log(this.priceData);
            }
        );
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    for (let d in editData['data']) {
                        let data = editData['data'][d];
                        this.inputForm.controls[data['code'] + '_price'].patchValue(data['value']);
                    }
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    Save () {
         let formData = this.prepareSaveData();

         if (this.isEditMode == true) {
             this.Update(this.selectedId, formData);
         } else {
             this.Create(formData);
         }
    }

    prepareSaveData () {
        const formModel = this.inputForm.value;
        console.log(formModel['input_date']);

        let priceArray = [];
        this.heatingProcess.forEach((code) => {
            priceArray.push(code.CfgCode + ':#:' + formModel[code.CfgCode + '_price']);
        });

        const saveData = {
            partner_code: formModel.partner_code,
            partner_name: formModel.partner_name,
            price: priceArray.join('=||=')
        }
        return saveData;
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.configService.load();
                        this.GetAll();
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
                    if (data.result == "success") {
                        this.inputForm.reset();
                        this.GetAll();
                        this.configService.load();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    Delete (id): void {
        this.dataService.Delete(id)
            .subscribe(
                data => {
                    if (data.result == "success") {
                        this.GetAll();
                        this.configService.load();
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.deleteFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method, code, name) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'delete') {
                this.deleteFormModal.show();
            } else if (method == 'write' || method == 'edit') {
                this.inputFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        switch (method) {
            case 'write':
                this.inputForm.reset();
                this.isEditMode = false;
            break;
            case 'edit':
                this.isEditMode = true;
                this.selectedId = code;
                this.inputForm.controls['partner_name'].patchValue(name);
                this.inputForm.controls['partner_code'].patchValue(code);
                this.Edit(code);
            break;
            case 'delete':
                this.selectedId = code;
            break;
        }
    }
}
