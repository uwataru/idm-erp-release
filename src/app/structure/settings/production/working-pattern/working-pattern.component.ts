import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { WorkingPatternService } from './working-pattern.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../../message.service';
import { Item } from './working-pattern.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './working-pattern.component.html',
    styleUrls: ['./working-pattern.component.css'],
    providers: [WorkingPatternService]
})

export class WorkingPatternComponent implements OnInit {
    configs: any;
    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    deleteConfirmMsg: string;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    editData: Item[];
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    inputForm: FormGroup;
    tDate = this.globals.tDate;
    patterns = [];

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
        private dataService: WorkingPatternService,
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

        this.inputForm = fb.group({});
    }

    ngOnInit() {
        this.panelTitle = '근무패턴 등록 현황';
        this.inputFormTitle = '근무패턴 등록';
        this.deleteFormTitle = '근무패턴 삭제';
        this.deleteConfirmMsg = '근무패턴 데이터를 삭제하시겠습니까?';

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

                this.rows.forEach((data) => {
                    this.inputForm.addControl('id_' + data['id'] + '_pattern_code', new FormControl(['', [Validators.required]]));
                    this.inputForm.addControl('id_' + data['id'] + '_working_group', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_working_hours', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group1_stime', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group1_etime', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group1_etime_is_nextday', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group1_working_time', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group2_stime', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group2_etime', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group2_etime_is_nextday', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group2_working_time', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group3_stime', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group3_etime', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group3_etime_is_nextday', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_group3_working_time', new FormControl(''));
                    this.inputForm.addControl('id_' + data['id'] + '_working_time_per_day', new FormControl(''));
                })
            }
        );
    }

    Edit () {
        this.dataService.GetAll().subscribe(
            editData =>
            {
                this.editData = editData;
                this.patterns = editData['data'];

                this.patterns.forEach((data) => {
                    let group1_etime_is_nextday = false;
                    if (data['group1_etime_is_nextday'] == 'Y') {
                        group1_etime_is_nextday = true;
                    }
                    let group2_etime_is_nextday = false;
                    if (data['group2_etime_is_nextday'] == 'Y') {
                        group2_etime_is_nextday = true;
                    }
                    let group3_etime_is_nextday = false;
                    if (data['group3_etime_is_nextday'] == 'Y') {
                        group3_etime_is_nextday = true;
                    }

                    this.inputForm.controls['id_' + data['id'] + '_pattern_code'].patchValue(data['pattern_code']);
                    this.inputForm.controls['id_' + data['id'] + '_working_group'].patchValue(data['working_group']);
                    this.inputForm.controls['id_' + data['id'] + '_working_hours'].patchValue(data['working_hours']);
                    this.inputForm.controls['id_' + data['id'] + '_group1_stime'].patchValue(data['group1_stime']);
                    this.inputForm.controls['id_' + data['id'] + '_group1_etime'].patchValue(data['group1_etime']);
                    this.inputForm.controls['id_' + data['id'] + '_group1_etime_is_nextday'].patchValue(group1_etime_is_nextday);
                    this.inputForm.controls['id_' + data['id'] + '_group1_working_time'].patchValue(data['group1_working_time']);
                    this.inputForm.controls['id_' + data['id'] + '_group2_stime'].patchValue(data['group2_stime']);
                    this.inputForm.controls['id_' + data['id'] + '_group2_etime'].patchValue(data['group2_etime']);
                    this.inputForm.controls['id_' + data['id'] + '_group2_etime_is_nextday'].patchValue(group2_etime_is_nextday);
                    this.inputForm.controls['id_' + data['id'] + '_group2_working_time'].patchValue(data['group2_working_time']);
                    this.inputForm.controls['id_' + data['id'] + '_group3_stime'].patchValue(data['group3_stime']);
                    this.inputForm.controls['id_' + data['id'] + '_group3_etime'].patchValue(data['group3_etime']);
                    this.inputForm.controls['id_' + data['id'] + '_group3_etime_is_nextday'].patchValue(group3_etime_is_nextday);
                    this.inputForm.controls['id_' + data['id'] + '_group3_working_time'].patchValue(data['group3_working_time']);
                    this.inputForm.controls['id_' + data['id'] + '_working_time_per_day'].patchValue(data['working_time_per_day']);
                });
            }
        );
    }

    // GetById (id): void {
    //     this.dataService.GetById(id).subscribe(rows => this.rows = rows);
    // }

    Save () {
         //disabled="!inputForm.valid"
         let formData = this.prepareSaveData();

         if (this.isEditMode == true) {
             this.Update(formData);
         } else {
             this.Create(formData);
         }
    }

    prepareSaveData () {
        const formModel = this.inputForm.value;

        let rowData = [];
        this.patterns.forEach((data) => {
            let colData = [];
            colData.push(data['id']);
            colData.push(formModel['id_' + data['id'] + '_pattern_code']);
            colData.push(formModel['id_' + data['id'] + '_working_group']);
            colData.push(formModel['id_' + data['id'] + '_working_hours']);
            colData.push(formModel['id_' + data['id'] + '_group1_stime']);
            colData.push(formModel['id_' + data['id'] + '_group1_etime']);
            colData.push(formModel['id_' + data['id'] + '_group1_etime_is_nextday']);
            colData.push(formModel['id_' + data['id'] + '_group1_working_time']);
            colData.push(formModel['id_' + data['id'] + '_group2_stime']);
            colData.push(formModel['id_' + data['id'] + '_group2_etime']);
            colData.push(formModel['id_' + data['id'] + '_group2_etime_is_nextday']);
            colData.push(formModel['id_' + data['id'] + '_group2_working_time']);
            colData.push(formModel['id_' + data['id'] + '_group3_stime']);
            colData.push(formModel['id_' + data['id'] + '_group3_etime']);
            colData.push(formModel['id_' + data['id'] + '_group3_etime_is_nextday']);
            colData.push(formModel['id_' + data['id'] + '_group3_working_time']);
            colData.push(formModel['id_' + data['id'] + '_working_time_per_day']);
            rowData.push(colData.join(':#:'))
        });

        const saveData = {
            pattern_data: rowData.join('=||=')
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

    Update (data): void {
        this.dataService.Update(data)
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

    //calculTime(id, num): void {
    calculTime(id): void {
        const formModel = this.inputForm.value;

        let t1 = formModel['id_' + id + '_group1_working_time'];
        let t2 = formModel['id_' + id + '_group2_working_time'];
        let t3 = formModel['id_' + id + '_group3_working_time'];
        let ret = (t1*1) + (t2*1) + (t3*1);

        this.inputForm.controls['id_' + id + '_working_time_per_day'].patchValue(ret);
        // let st = formModel['id_' + id + '_group' + num + '_stime'];
        // let et = formModel['id_' + id + '_group' + num + '_etime'];
        // let nd = formModel['id_' + id + '_group' + num + '_etime_is_nextday'];
        // if (st != '' && st != '0' && et != '' && et != '0') {
        //     // 초로 환산
        //     let smin = this.calculMin(st);
        //     let emin = this.calculMin(et);
        //     if (nd == true) {
        //         emin += 60 * 24;
        //     }
        //     let t = Math.round((emin - smin) / 60 * 10) * 0.1;
        //     this.inputForm.controls['id_' + id + '_group' + num + '_working_time'].patchValue(t);
        // }
    }

    // calculMin(t) {
    //     var m = t.split(':');
    //     return (m[0] * 60) + (m[1] * 1);
    // }

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
                this.isEditMode = false;
            break;
            case 'edit':
                this.isEditMode = true;
                this.Edit();
            break;
        }
    }
}
