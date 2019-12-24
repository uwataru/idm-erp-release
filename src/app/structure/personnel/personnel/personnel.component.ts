import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../message.service';

import { PersonnelService } from './personnel.service';
import { Item } from './personnel.item';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {UtilsService} from "../../../utils.service";

declare var $: any;

@Component({
  selector: 'app-personnel',
  templateUrl: './personnel.component.html',
  styleUrls: ['./personnel.component.scss'],
  providers: [PersonnelService, DatePipe]
})
export class PersonnelComponent implements OnInit {
    tDate = this.globals.tDate;

    panelTitle: string;
    inputFormTitle: string;
    editFormTitle: string;
    deleteFormTitle: string;
    worktimeFormTitle: string;
    deleteConfirmMsg: string;

    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    enumData: Item;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    selectedCnt: number;
    editData: Item;
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    searchForm: FormGroup;
    inputForm: FormGroup;
    editForm: FormGroup;
    inputWorktimeForm: FormGroup;

    affiliationList: any[] = this.globals.configs['affiliationList'];
    listSltdAfilId: number = 0;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    workHistoryDataCnt: number;
    name: string;
    employee_num: string;

    tmpTime: number[] = new Array();
    tmpWage: number[] = new Array();
    tmpResult: number[] = new Array();

    allWage: number;
    allTime: number;
    allResult: number;

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
    @ViewChild('WorkTimeFormModal') workTimeFormModal: ModalDirective;

    constructor(
      @Inject(FormBuilder) public fb: FormBuilder,
      private datePipe: DatePipe,
      private dataService: PersonnelService,
      private globals: AppGlobals,
      private route: ActivatedRoute,
      private configService: ConfigService,
      private messageService: MessageService,
      private utils: UtilsService
    ) {
      // 접근권한 체크
    //   if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
    //     if (route.routeConfig.data.id in this.globals.userPermission) {
    //         console.log(route.routeConfig.data.id);
    //         if (this.globals.userPermission[route.routeConfig.data.id]['executive_auth'] == true) {
    //             this.isExecutable = true;
    //         }
    //         if (this.globals.userPermission[route.routeConfig.data.id]['print_auth'] == true) {
    //             this.isPrintable = true;
    //         }
    //     }
    //   }

      this.inputForm = fb.group({
        group_name: ['', [Validators.required]],
        group_id: ['', [Validators.required]],
        name: ['', [Validators.required]],
        employee_num: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        addr: ['', [Validators.required]],
        input_date: ['', [Validators.required]],
        specialnote: ''
        
      });
      this.searchForm = fb.group({
        sch_affiliation_name: '',
        sch_group_id: ''
      });
  }
  buildInputWorktimeForm(){
      this.inputWorktimeForm = this.fb.group({
          id_1: '',
          work_date_1: ['', [Validators.required]],
          work_time_1: ['', [Validators.required]],
          hourly_wage_1: ['', [Validators.required]],
          day_wage_1: ['', [Validators.required]],
      });
  }

  ngOnInit() {
    this.panelTitle = '생산인력현황';
    this.inputFormTitle = '생산인력 등록';
    this.editFormTitle = '생산인력 수정';
    this.deleteFormTitle = '생산인력 삭제';
    this.worktimeFormTitle = '근무시간 산출';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

    this.workHistoryDataCnt = 1;
    this.buildInputWorktimeForm();
    this.getAll();

    // this.inputForm.controls['input_date'].setValue(this.InputDate);

    $(document).ready(function(){
        let modalContent: any = $('.modal-content');
        let modalHeader = $('.modal-header');
        modalHeader.addClass('cursor-all-scroll');
        modalContent.draggable({
            handle: '.modal-header'
        });
    });
  }

  onSelect({ selected }) {
    this.selectedCnt = selected.length;
    if (this.selectedCnt == 1) {
      this.selectedId = selected[0].id;
    //   this.inputForm.controls['id'].setValue(this.selectedId);
    }
}

    getAll(): void {

        this.selectedId = '';
        this.selected = [];

        let params = {
            settings_id: this.searchForm.value['sch_group_id'],
        }
        console.log(this.searchForm.value['sch_group_id']);
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];


                this.isLoadingProgress = false;
            }
        );
    }

    hiddenCheck() {
        let formData = this.searchForm.value;

        if (formData.sch_affiliation_name == '') {
            this.searchForm.controls['sch_group_id'].setValue('');
        }
        this.getAll();
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        group_name: this.formData.group_name,
                        group_id: this.formData.group_id,
                        name: this.formData.name,
                        employee_num: this.formData.employee_num,
                        phone: this.formData.phone,
                        addr: this.formData.addr,
                        input_date: this.formData.input_date,
                        specialnote: this.formData.specialnote,
                    });
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    Save () {
        let formModel = this.inputForm.value;


          let input_date = this.datePipe.transform(formModel['input_date'], 'yyyy-MM-dd');


         if (this.isEditMode == true) {
            let formData = {
                input_date: input_date,
                group_id: formModel.group_id,
                name: formModel.name,
                work_skill: formModel.work_skill,
                employee_num: formModel.employee_num,
                phone: formModel.phone,
                addr: formModel.addr,
                specialnote:"",
              };
             this.Update(this.selectedId, formData);
         } else {
            let formData = {
                input_date: input_date,
                group_id: formModel.group_id,
                name: formModel.name,
                work_skill: "",
                employee_num: formModel.employee_num,
                phone: formModel.phone,
                addr: formModel.addr,
                specialnote:"",
              };
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

    Delete (id): void {
        this.dataService.Delete(id)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.deleteFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    getWorkHistory (id): void {
        this.workHistoryDataCnt = 1;
        this.dataService.GetWorkHistory(id)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        console.log(data);
                        console.log(this.inputWorktimeForm);
                        this.name = data['data']['name'];
                        this.employee_num = data['data']['employee_num'];

                        let workData = data['data']['work_history'];
                        let len = workData.length;
                        for(let i = 1; i<=len; i++){
                            // console.error(workData[i]);
                            if(i != 1) {
                                this.addWorkTimeRow();
                            }
                            this.inputWorktimeForm.controls['id_' + i].setValue(workData[i-1].id);
                            this.inputWorktimeForm.controls['work_date_' + i].setValue(workData[i-1].work_date);
                            this.inputWorktimeForm.controls['work_time_' + i].setValue(workData[i-1].work_time);
                            this.inputWorktimeForm.controls['hourly_wage_' + i].setValue(this.utils.addComma(workData[i-1].hourly_wage));
                            this.calculateDayWage('', i);
                        }
                        console.log(this.inputWorktimeForm)

                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.deleteFormModal.hide();
                }
            )
    }


    openModal(method, id) {
        // 실행권한
        // if (this.isExecutable == true) {
            if (method == 'delete') {
                this.deleteFormModal.show();
            } else if (method == 'write') {
                this.inputFormModal.show();
                this.inputForm.controls['input_date'].setValue(this.tDate);

            } else if (method == 'worktime'){
                this.allResult = 0;
                this.allTime = 0;
                this.allWage = 0;
                this.buildInputWorktimeForm();
                this.workTimeFormModal.show();
                this.getWorkHistory(id);
                
            }
        // } else {
            // alert(this.globals.isNotExecutable);
            // return false;
        // }

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
                this.getEmployeeNum();

            }
        }
    }

    getEmployeeNum(){
        this.dataService.GetEmployeeNum().subscribe(
            enumData =>
            {
                this.enumData = enumData;
                console.log(enumData);

                this.inputForm.controls['employee_num'].setValue(enumData['employee_num']);


                this.isLoadingProgress = false;
            }
        );
        this.isEditMode = false;
    }

    onSearchAffiliationList(event: TypeaheadMatch): void {
        console.log(event);
        let id = event.item['id'];
        if (id == '') {
            this.listSltdAfilId = 0;
        } else {
            this.listSltdAfilId = id;
            this.searchForm.controls['sch_group_id'].setValue(this.listSltdAfilId);
        }

        const val = this.listSltdAfilId;

        this.getAll();
    }
    InputAffiliationList(event: TypeaheadMatch): void {
        console.log(event);
        let id = event.item['id'];
        if (id == '') {
            this.listSltdAfilId = 0;
        } else {
            this.listSltdAfilId = id;
            this.inputForm.controls['group_id'].setValue(this.listSltdAfilId);
        }


    }

    addWorkTimeRow() {
        // console.log('addMaterialRow', index);
        this.workHistoryDataCnt++;
        let index = this.workHistoryDataCnt;

        this.inputWorktimeForm.addControl('id_' + index, new FormControl(''));
        this.inputWorktimeForm.addControl('work_date_' + index, new FormControl('', Validators.required));
        this.inputWorktimeForm.addControl('work_time_' + index, new FormControl('', Validators.required));
        this.inputWorktimeForm.addControl('hourly_wage_' + index, new FormControl('', Validators.required));
        this.inputWorktimeForm.addControl('day_wage_' + index, new FormControl('', Validators.required));
    }
    removeMaterialRow(index) {
        console.log('removeMaterialRow', index);
        this.inputWorktimeForm.controls['work_time_'+index].setValue(-1); //save() 할 때 이 값을 기준으로 삭제된 행인지 판단.
        this.inputWorktimeForm.controls['work_date_' + index].setValue(-1); //validator 위해서 임의에 값 넣어놈
        this.inputWorktimeForm.controls['hourly_wage_' + index].setValue(-1);
        this.inputWorktimeForm.controls['day_wage_' + index].setValue(-1);
    }

    calculateDayWage(event, index) {
        // console.log('calculatePrice', index);
        let formData = this.inputWorktimeForm.value;
        var tmpTime = 0;
        var tmpWage = 0;
        var tmpResult = 0;

        // console.log(formData['work_time_'+index], formData['hourly_wage_'+index]);
        let mWtime = Number(formData['work_time_'+index]) * 1;
        this.tmpTime[index-1] = mWtime;
        
        
        let mHwage = Number(this.utils.removeComma(formData['hourly_wage_'+index])) * 1;
        this.tmpWage[index-1] = mHwage;

        let result = mWtime * mHwage;
        this.tmpResult[index-1] = result;
        
        this.inputWorktimeForm.controls['day_wage_'+index].setValue(this.utils.addComma(result));

        for(let i=0; i<index; i++){
            tmpTime += this.tmpTime[i];
            tmpWage += this.tmpWage[i];
            tmpResult += this.tmpResult[i];
        }
        this.allTime  = this.utils.addComma(tmpTime);
        this.allWage  = this.utils.addComma(tmpWage);
        this.allResult  = this.utils.addComma(tmpResult);


        console.log('tmpTime',tmpTime);
        console.log('tmpWage',tmpWage);
        console.log('tmpResult',tmpResult);
        // console.log('Time', this.tmpTime[index-1], index);
        // console.log('Time', this.tmpTime, index);
        // console.log('Price', this.tmpWage[index-1], index);
        // console.log('Price', this.tmpWage, index);
        // console.log('Re', this.tmpResult,index);


        if(event != '')
            this.AddComma(event);
    }

    chkViewAddBtn(index) {
        let len = this.workHistoryDataCnt;
        let unVisibleItemCnt = 0;
        for (let i = index + 1; i <= len; i++) {
            if (this.inputWorktimeForm.value['work_time_' + i] == -1) {
                unVisibleItemCnt++;
            }
        }
        // console.log(index, len , upItemCnt);
        if((len - unVisibleItemCnt) == index){
            return true;
        }
        return false;

    }

    chkViewRemoveBtn(index){
        let len = this.workHistoryDataCnt;
        let unVisibleItemCnt = 0;
        for (let i = 1; i <= len; i++) {
            if (this.inputWorktimeForm.value['work_time_' + i] == -1) {
                unVisibleItemCnt++;
            }
        }
        if(len - unVisibleItemCnt > 1){
            return true;
        }
        return false;
    }

    saveWorkTime(){
        let formData = this.inputWorktimeForm.value;
        formData.work_history = [];
        
        let state = 1;
        let id = '';
        for(let i=1; i<=this.workHistoryDataCnt; i++){
            id = formData['id_'+i];
            if(id != '' && formData['work_time_'+i] == -1) {
                state = 3; //삭제
            } else{
                if(id == '') {
                    state = 1; //추가
                } else{
                    state = 2; //수정
                }
            }
            // console.log(state);
            if(state == 1 || ((state == 2 || state == 3) && id != "") ){
                console.log(id, state, i, formData);
                formData.work_history.push( this.makeTimeTable(id, state, i, formData) );
            }

            delete formData['work_time_'+i];
            delete formData['work_date_'+i];
            delete formData['hourly_wage_'+i];
            delete formData['day_wage_'+i];
            delete formData['id_'+i];
        }

        console.log('save', this.selectedId, formData);
        this.CreateWroktime(this.selectedId, formData);
    }

    CreateWroktime (id, data): void {
        this.dataService.CreateWorkHistory(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.workTimeFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    makeTimeTable(id, state, index, formData){
        let timeTable = {
            id: id,
            work_time: parseInt(this.utils.removeComma(formData['work_time_' + index])),
            work_date: this.datePipe.transform(formData['work_date_' + index], 'yyyy-MM-dd'),
            hourly_wage: parseInt(this.utils.removeComma(formData['hourly_wage_' + index])),
            day_wage: parseInt(this.utils.removeComma(formData['day_wage_' + index])),
            state: state
        }
        return timeTable;
    }

    AddComma(event) {
        var valArray = event.target.value.split('.');
        for (var i = 0; i < valArray.length; ++i) {
            valArray[i] = valArray[i].replace(/\D/g, '');
        }

        var newVal: string;

        if (valArray.length === 0) {
            newVal = '0';
        } else {
            let matches = valArray[0].match(/[0-9]{3}/mig);

            if (matches !== null && valArray[0].length > 3) {
                let commaGroups = Array.from(Array.from(valArray[0]).reverse().join('').match(/[0-9]{3}/mig).join()).reverse().join('');
                let replacement = valArray[0].replace(commaGroups.replace(/\D/g, ''), '');

                newVal = (replacement.length > 0 ? replacement + ',' : '') + commaGroups;
            } else {
                newVal = valArray[0];
            }

            if (valArray.length > 1) {
                newVal += '.' + valArray[1].substring(0, 2);
            }
        }
        this.inputWorktimeForm.controls[event.target.id].setValue(this.utils.addComma(newVal));
        //this.inputForm.patchValue({'combi_product_price' : this.utils.addComma(newVal)});
    }

}
