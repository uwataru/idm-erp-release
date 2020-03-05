import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ProductionLineService } from './production-line.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { MessageService } from '../../../../message.service';
import { Item } from './production-line.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './production-line.component.html',
    styleUrls: ['./production-line.component.css'],
    providers: [ProductionLineService]
})

export class ProductionLineComponent implements OnInit {
    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    deleteConfirmMsg: string;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;
    
    processList: any[] = this.globals.configs['processList'];
    editData: Item;
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    inputForm: FormGroup;

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
        private dataService: ProductionLineService,
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
            line_no: ['', [Validators.required]],
            process_id: '',
            run_time: ['', [Validators.required]],
            worker_cnt: ['', [Validators.required]],
            is_outsourcing: ['', [Validators.required]],
            main_process: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '작업LINE';
        this.inputFormTitle = '작업LINE 등록';
        this.deleteFormTitle = '작업LINE 삭제';
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
        this.dataService.GetAll().subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
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
                        line_no: this.formData.line_no,
                        main_process: this.formData.process_assembly_type,
                        process_id: this.formData.process_id,
                        run_time: this.formData.run_time,
                        worker_cnt: this.formData.worker_cnt,
                        is_outsourcing: this.formData.is_outsourcing
                    });
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    Save () {
         //disabled="!inputForm.valid"
         let formData = this.inputForm.value;
         if(formData.is_outsourcing == "Y"){
            formData.is_outsourcing = true;
         }else{
            formData.is_outsourcing = false;
         }
         formData.line_no = formData.line_no;
         formData.process_id = parseInt(formData.process_id);
         formData.worker_cnt = parseInt(formData.worker_cnt);
         formData.run_time = parseInt(formData.run_time);

         if (this.isEditMode == true) {
             this.Update(this.selectedId, formData);
         } else {
             this.Create(formData);
         }
         console.log(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.GetAll();
                        this.configService.load();
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

    openModal(method, id) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'delete') {
                this.deleteFormModal.show();
            } else if (method == 'write') {
                this.inputFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
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
                //this.inputForm.controls['input_date'].setValue(this.tDate);
                this.isEditMode = false;
            }
        }
    }

    onSelectInputProcess(event: TypeaheadMatch): void {
        console.log(event.item.id);
        if (event.item == '') {
            this.inputForm.controls['process_id'].setValue(0);
        } else {
            this.inputForm.controls['process_id'].setValue(event.item.id);
        }
    }
}
