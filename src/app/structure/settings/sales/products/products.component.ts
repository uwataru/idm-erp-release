import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { ProductsService } from './products.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, PartnerItem } from './products.item';
declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  providers: [ProductsService]
})
export class ProductsComponent implements OnInit {
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
    selectedId: string;
    listData: Item[];
    editData: Item;

    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['type5Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_product_name: string;
    sch_st: number;
    st: number;
    formData: Item['data'];
    rows = [];
    temp = [];
    delId = [];
    selected = [];
    searchForm: FormGroup;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    combiChecked: boolean = false;
    combiId: number;
    prodTypeStr: string;
    combiTypeStr: string;
    tDate = this.globals.tDate;
    inputPartners: any[] = this.globals.configs['type5Partners'];
    inputSltdPaCode: number = 0;
    productionLines: any[] = this.globals.configs['productionLine'];
    cuttingMethods: any[] = this.globals.configs['cuttingMethod'];
    heatingProcess: any[] = this.globals.configs['heatingProcess'];
    specialProcess: any[] = this.globals.configs['specialProcess'];
    product_price: number;
    combi_product_price: number;
    ann_qt: number;
    lot_qt: number;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '단종처리되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('StatusFormModal') statusFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private electronService: ElectronService,
        private dataService: ProductsService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
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

        this.searchForm = fb.group({
            sch_partner_name: '',
            sch_product_name: ''
        });
        this.inputForm = fb.group({
            input_date: ['', Validators.required],
            partner_code: '',
            partner_name: '',
            product_code: ['', [Validators.required, Validators.minLength(4)]],
            combi_product_code: '',
            is_combi: '',
            product_type: '',
            product_name: '',
            combi_product_name: '',
            product_price: ['', Validators.required],
            combi_product_price: '',
            is_tmp_price: '',
            drawing_no: ['', Validators.required],
            sub_drawing_no: '',
            material: ['', Validators.required],
            sub_material: '',
            steel_maker: '',
            size: ['', Validators.required],
            cut_length: ['', Validators.required],
            material_weight: ['', Validators.required],
            product_weight: ['', Validators.required],
            combi_product_weight: '',
            input_weight: ['', Validators.required],
            production_line: ['', Validators.required],
            preparation_time: ['', Validators.required],
            ct: ['', Validators.required],
            ea_m: ['', Validators.required],
            cutting_method: '',
            heating_process: '',
            heating_spec: '',
            combi_heating_spec: '',
            special_process: '',
            sq: '',
            inspection: '',
            selection: '',
            ann_qt: '',
            lot_qt: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '제품 등록 현황';
        this.inputFormTitle = '제품 등록';
        this.uploadFormTitle = '제품 엑셀업로드';

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
            product_name: formData.sch_product_name,
            st: this.sch_st,
            sortby: ['sort_no'],
            order: ['asc'],
            maxResultCount: 10000
        }
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        if(formData.sch_partner_name != '' && !this.listSltdPaCode) {
            this.messageService.add('거래처 코드를 거래처목록에서 선택하세요.');
            return;
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

                setTimeout(()=>{ document.getElementsByTagName('datatable-body')[0].scrollTop = 1; },0);
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
         let product_val = formData.sch_product_name;

         const temp = this.temp.filter(function(d){
             d.partner_code = String(d.partner_code);
             return d.partner_code.indexOf(partner_code) !== -1 && (d.product_code.indexOf(product_val) !== -1 || d.product_name.indexOf(product_val) !== -1) || !partner_code && !product_val;
         });
 
         this.rows = temp;
                  
    }


    updateFilter(event) {
        
        let partner_code = this.listSltdPaCode;
        const val = event.target.value;

        // filter data
        const temp = this.temp.filter(function(d){
            return d.partner_code.indexOf(partner_code) !== -1 && (d.product_code.indexOf(val) !== -1 || d.product_name.indexOf(val) !== -1) || !val && !partner_code;
        })

        // update the rows
        this.rows = temp;
    }


    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }
    makeCombiCode(event) {

        let code = event.target.value;
        
        if(code) {
            //product code 중복체크
            this.dataService.GetByCode(code).subscribe(
                data => {
                    if(data['productCodeCnt'] > 0) {
                        this.messageService.add('입력하신 제품번호로 등록된 제품이 숨김탭에 이미 존재합니다.');
                        this.inputForm.controls['product_code'].setValue('');
                        return false;
                    }
                }
            )
        }

        if (this.combiChecked == false) return false;

        let combiCode:string;
        if (code.indexOf( "BB" ) > 0) {
            combiCode = code.replace('BB', 'AA');
        }
        if (code.indexOf( "AA" ) > 0) {
            combiCode = code.replace('AA', 'BB');
        }
        this.getCombiTypeString(code);
        this.inputForm.controls['combi_' + event.target.id].setValue(combiCode);
    }

    makeCombiName(event) {
        if (this.combiChecked == false) return false;

        let name = event.target.value;
        let combiName:string;
        if (name.indexOf( "내륜" ) > 0) {
            combiName = name.replace('내륜', '외륜');
        }
        if (name.indexOf( "외륜" ) > 0) {
            combiName = name.replace('외륜', '내륜');
        }
        this.inputForm.controls['combi_' + event.target.id].setValue(combiName);
    }

    copyCombiText(event) {
        if (this.combiChecked == false) return false;

        let text = event.target.value;
        this.inputForm.controls['combi_' + event.target.id].setValue(text);
    }

    toggleCombiItem() {
        this.combiChecked = this.combiChecked === true ? false : true;
        if (this.combiChecked == true) {
            this.prodTypeStr = "내륜";
            this.combiTypeStr = "외륜";
            this.getCombiTypeString(this.inputForm.controls['product_code'].value);
        }
    }

    getCombiTypeString(code) {
        if (!code) return false;

        if (code.indexOf( "BB" ) > 0) {
            this.prodTypeStr = "내륜";
            this.combiTypeStr = "외륜";
        }
        if (code.indexOf( "AA" ) > 0) {
            this.prodTypeStr = "외륜";
            this.combiTypeStr = "내륜";
        }
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let product_price = this.utils.addComma(this.formData.product_price);
                    let ann_qt = this.utils.addComma(this.formData.ann_qt);
                    let lot_qt = this.utils.addComma(this.formData.lot_qt);

                    let is_combi = false;
                    this.combiChecked = false;
                    if (this.formData.is_combi == 'Y') {
                        is_combi = true;
                        this.combiChecked = true;
                    }
                    let is_tmp_price = false;
                    if (this.formData.is_tmp_price == 'Y') {
                        is_tmp_price = true;
                    }
                    let sq = false;
                    if (this.formData.sq == 'Y') {
                        sq = true;
                    }
                    let inspection = false;
                    if (this.formData.inspection == 'Y') {
                        inspection = true;
                    }
                    let selection = false;
                    if (this.formData.selection == 'Y') {
                        selection = true;
                    }

                    // 콤비제품인 경우
                    let combi_product_code = '';
                    let combi_product_name = '';
                    let combi_product_price = 0;
                    let combi_product_weight = 0.0;
                    let combi_heating_spec = '';
                    if (is_combi == true) {
                        combi_product_code = editData['combiData'].product_code;
                        combi_product_name = editData['combiData'].product_name;
                        combi_product_price = this.utils.addComma(editData['combiData'].product_price);
                        combi_product_weight = editData['combiData'].product_weight;
                        combi_heating_spec = editData['combiData'].heating_spec;

                        this.combiId = editData['combiData'].id;
                        this.getCombiTypeString(this.formData.product_code);
                    }

                    this.inputForm.patchValue({
                        input_date: this.formData.input_date,
                        partner_code: this.formData.partner_code,
                        partner_name: this.formData.partner_name,
                        product_code: this.formData.product_code,
                        is_combi: is_combi,
                        product_type: this.formData.product_type,
                        product_name: this.formData.product_name,
                        product_price: product_price,
                        is_tmp_price: is_tmp_price,
                        drawing_no: this.formData.drawing_no,
                        sub_drawing_no: this.formData.sub_drawing_no,
                        material: this.formData.material,
                        sub_material: this.formData.sub_material,
                        steel_maker: this.formData.steel_maker,
                        size: this.formData.size,
                        cut_length: this.formData.cut_length,
                        material_weight: this.formData.material_weight,
                        product_weight: this.formData.product_weight,
                        input_weight: this.formData.input_weight,
                        production_line: this.formData.production_line,
                        preparation_time: this.formData.preparation_time,
                        ct: this.formData.ct,
                        ea_m: this.formData.ea_m,
                        cutting_method: this.formData.cutting_method,
                        heating_process: this.formData.heating_process,
                        heating_spec: this.formData.heating_spec,
                        special_process: this.formData.special_process,
                        sq: sq,
                        inspection: inspection,
                        selection: selection,
                        ann_qt: ann_qt,
                        lot_qt: lot_qt,
                        combi_product_code: combi_product_code,
                        combi_product_name: combi_product_name,
                        combi_product_price: combi_product_price,
                        combi_product_weight: combi_product_weight,
                        combi_heating_spec: combi_heating_spec
                    });
                }
            }
        );
    }

    AddComma(event) {
        var valArray = event.target.value.split('.');
        for(var i = 0; i < valArray.length; ++i) {
            valArray[i] = valArray[i].replace(/\D/g, '');
        }

        var newVal: string;

        if (valArray.length === 0) {
            newVal = '0';
        } else {
            let matches = valArray[0].match(/[0-9]{3}/mig);

            if(matches !== null && valArray[0].length > 3) {
                let commaGroups = Array.from(Array.from(valArray[0]).reverse().join('').match(/[0-9]{3}/mig).join()).reverse().join('');
                let replacement = valArray[0].replace(commaGroups.replace(/\D/g, ''), '');

                newVal = (replacement.length > 0 ? replacement + ',' : '') + commaGroups;
            } else {
                newVal = valArray[0];
            }

            if(valArray.length > 1) {
                newVal += "." + valArray[1].substring(0,2);
            }
        }
        this.inputForm.controls[event.target.id].setValue(this.utils.addComma(newVal));
        //this.inputForm.patchValue({'combi_product_price' : this.utils.addComma(newVal)});
    }

    Save () {
         let formData = this.inputForm.value;

         // 숫자필드 체크
         formData.material_weight = formData.material_weight * 1;
         formData.product_weight = formData.product_weight * 1;
         formData.product_price = this.utils.removeComma(formData.product_price) * 1;
         formData.ann_qt = this.utils.removeComma(formData.ann_qt) * 1;
         formData.lot_qt = this.utils.removeComma(formData.lot_qt) * 1;
         formData.size = formData.size * 1;
         formData.ct = formData.ct * 1;
         formData.ea_m = formData.ea_m * 1;
         formData.preparation_time = formData.preparation_time * 1;

         if (this.combiChecked == true) {
             formData.combi_id = this.combiId;
             formData.combi_product_price = this.utils.removeComma(formData.combi_product_price) * 1;
             formData.combi_product_weight = formData.combi_product_weight * 1;
         }

         if (this.isEditMode == true) {
             this.Update(this.selectedId, formData);
         } else {
             formData.st = 1;
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
                this.statusFormTitle = '제품 단종';
                this.statusFormValue = -1;
                this.statusConfirmMsg = '선택하신 제품을 단종처리하시겠습니까?';
            break;
            case 'hide':
                this.statusFormTitle = '제품 숨김';
                this.statusFormValue = 0;
                this.statusConfirmMsg = '선택하신 제품을 숨김처리하시겠습니까?';
            break;
            case 'use':
                this.statusFormTitle = '제품 사용';
                this.statusFormValue = 1;
                this.statusConfirmMsg = '선택하신 제품을 사용처리하시겠습니까?';
            break;
        }
        if (id) {
            if (id == 'selected') {
                let idArr = [];
                this.selected.forEach((e:any) => {
                    idArr.push(e.id);
                });
                this.selectedId = idArr.join(',');
                console.log(this.selectedId);
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
                this.combiChecked = false;
                this.inputForm.controls['input_date'].setValue(this.tDate);
                this.isEditMode = false;
            }
        }
    }

    // calculWeight():void {
    //     // 소중(kg) = 규격 * 규격 * 3.14 / 4 * 0.000007854
    //     // 투중(kg) = 소중 * 1.03
    //     let size = this.inputForm.controls['size'].value;
    //     let len = this.inputForm.controls['cut_length'].value;
    //     let weight = (size * size * 3.14 * len) / 4 * 0.000007854 * 100;
    //     let materialWeight = Math.round(weight) * 0.01;
    //     this.inputForm.controls['material_weight'].setValue(materialWeight);
    //     let inputWeight = Math.round(weight * 1.03) * 0.01; //(weight * 1.03).toFixed(2);
    //     this.inputForm.controls['input_weight'].setValue(inputWeight);
    // }

    calculCutLength():void {
        // 길이(mm) = (소중 / 0.000007854 * 4) / (3.14 * 규격 * 규격), 소수 1자리(반올림)
        // 투중(kg) = 소중 * 1.03, 소수 2자리(반올림)
        let materialWeight = this.inputForm.controls['material_weight'].value;
        let size = this.inputForm.controls['size'].value;
        let len = (materialWeight / 0.000007854 * 4) / (3.14 * size * size) * 10;
        let cutLength = Math.round(len) * 0.1;
        this.inputForm.controls['cut_length'].setValue(cutLength);
        let inputWeight = Math.round(materialWeight * 103) * 0.01; //(weight * 1.03).toFixed(2);
        this.inputForm.controls['input_weight'].setValue(inputWeight);
    }

    calculEam():void {
        // Ea/m = 60(초) / CT * 설비효율
        let pptime = this.inputForm.controls['preparation_time'].value * 1;
        let ct = this.inputForm.controls['ct'].value * 1;
        let line = this.inputForm.controls['production_line'].value;
        let eff:number = this.getEfficiency(line) * 1;

        let rndValue = 60 / ct * eff * 0.01;
        let eam = rndValue.toFixed(1);
        this.inputForm.controls['ea_m'].setValue(eam);
    }

    getEfficiency(line) {
        let ret = 0;
        this.productionLines.forEach((e:any) => {
            if (e.LineCode == line) {
                ret = e.Efficiency;
            }
        });

        return ret;
    }

    excelDown(type): void {
        this.dataService.GetExcelFile(type).subscribe(
            blob => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                if(type) importedSaveAs(blob, "제품마스터.xlsx");
                else importedSaveAs(blob, "제품등록현황.xlsx");

                let win = this.electronService.remote.getCurrentWindow();

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
                            this.uploadFormModal.hide();
                        } else {
                            alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
                            console.log(`Download failed: ${state}`)
                        }
                    });
                });
            },
            error => this.errorMessage = <any>error
        );
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

    getRowHeight(row) {
        if(!row) return 50;
        if(row.height === undefined) return 50;
        return row.height;
    }

}
