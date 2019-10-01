import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { WorkingGroupLeaderService } from './working-group-leader.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../../message.service';
import { Item } from './working-group-leader.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './working-group-leader.component.html',
    styleUrls: ['./working-group-leader.component.css'],
    providers: [WorkingGroupLeaderService]
})

export class WorkingGroupLeaderComponent implements OnInit {
    configs: any;
    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    deleteConfirmMsg: string;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;
    currentPeriodId: string;
    editData: Item;
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    inputForm: FormGroup;
    tDate = this.globals.tDate;
    lines: any = [];

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
        private dataService: WorkingGroupLeaderService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
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
            input_date: ['', [Validators.required]],
            start_date: ['', [Validators.required]],
            end_date: ['', [Validators.required]],
            line_workers: fb.array([])
        });

        let productionLine = this.globals.configs['productionLine'];
        productionLine.forEach((lines) => {
            this.lines.push(lines.LineCode);
        });

        this.lines.forEach((code) => {
            this.inputForm.addControl('line_' + code + '_code', new FormControl(['', [Validators.required]]));
            this.inputForm.addControl('line_' + code + '_group1_code', new FormControl(''));
            this.inputForm.addControl('line_' + code + '_group1_leader', new FormControl(''));
            this.inputForm.addControl('line_' + code + '_group2_code', new FormControl(''));
            this.inputForm.addControl('line_' + code + '_group2_leader', new FormControl(''));
            this.inputForm.addControl('line_' + code + '_group3_code', new FormControl(''));
            this.inputForm.addControl('line_' + code + '_group3_leader', new FormControl(''));
        })
    }

    ngOnInit() {
        this.panelTitle = '조반장 등록 현황';
        this.inputFormTitle = '조반장 등록';
        this.deleteFormTitle = '조반장 삭제';
        this.deleteConfirmMsg = '조반장 데이터를 삭제하시겠습니까?';

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
        this.dataService.GetAll().subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
                this.currentPeriodId = listData['CurrentPeriodId'];
            }
        );
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
                        start_date: this.formData.start_date,
                        end_date: this.formData.end_date
                    });

                    let lines = this.formData.workers.split('=||=');
                    lines.forEach((lineData) => {
                        let data = lineData.split(':#:');
                        this.inputForm.controls['line_' + data[0] + '_code'].patchValue(data[0]);
                        this.inputForm.controls['line_' + data[0] + '_group1_code'].patchValue(data[1]);
                        this.inputForm.controls['line_' + data[0] + '_group1_leader'].patchValue(data[2]);
                        this.inputForm.controls['line_' + data[0] + '_group2_code'].patchValue(data[3]);
                        this.inputForm.controls['line_' + data[0] + '_group2_leader'].patchValue(data[4]);
                        this.inputForm.controls['line_' + data[0] + '_group3_code'].patchValue(data[5]);
                        this.inputForm.controls['line_' + data[0] + '_group3_leader'].patchValue(data[6]);
                    });
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    lineCodePatchValues () {
        this.lines.forEach((code) => {
            this.inputForm.controls['line_' + code + '_code'].patchValue(code);
        });
    }

    // GetById (id): void {
    //     this.dataService.GetById(id).subscribe(rows => this.rows = rows);
    // }

    Save () {
         //disabled="!inputForm.valid"
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

        let workers = [];
        this.lines.forEach((code) => {
            let lineData = [];
            lineData.push(formModel['line_' + code + '_code']);
            lineData.push(formModel['line_' + code + '_group1_code']);
            lineData.push(formModel['line_' + code + '_group1_leader']);
            lineData.push(formModel['line_' + code + '_group2_code']);
            lineData.push(formModel['line_' + code + '_group2_leader']);
            lineData.push(formModel['line_' + code + '_group3_code']);
            lineData.push(formModel['line_' + code + '_group3_leader']);

            workers.push(lineData.join(':#:'))
        });

        const saveData = {
            input_date: formModel.input_date,
            start_date: formModel.start_date,
            end_date: formModel.end_date,
            workers: workers.join('=||=')
        }
        return saveData;
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
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
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.deleteFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method) {
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
                this.inputForm.controls['input_date'].setValue(this.tDate);
                this.lineCodePatchValues();
                this.isEditMode = false;
            break;
            case 'edit':
                this.isEditMode = true;
                this.selectedId = this.currentPeriodId;
                this.Edit(this.selectedId);
            break;
            case 'delete':
                this.selectedId = this.currentPeriodId;
            break;
        }
    }
}
