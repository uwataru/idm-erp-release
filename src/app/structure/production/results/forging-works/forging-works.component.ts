import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ElectronService} from '../../../../providers/electron.service';
import {saveAs as importedSaveAs} from 'file-saver';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {ForgingWorksService} from './forging-works.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './forging-works.item';

@Component({
  selector: 'app-page',
  templateUrl: './forging-works.component.html',
  styleUrls: ['./forging-works.component.scss'],
  providers: [ForgingWorksService, DatePipe]
})
export class ForgingWorksComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  uploadFormTitle: string;
  isLoadingProgress: boolean = false;

  inputForm: FormGroup;
  formData: Item['data'];
  productionLines: any[] = this.globals.configs['productionLine'];
  defectiveClassification: any[] = this.globals.configs['defectiveClassification'];

  defective_qty: number;
  loss_qty: number;
  lucre_qty: number;
  order_qty: number;
  assembly_qty: number;

  assembly_sum: number;
  defective_sum: number;
  loss_sum: number;
  lucre_sum: number;
  more_less_qty: number;
  orig_assembly_sum: number;
  orig_defective_sum: number;
  orig_loss_sum: number;
  orig_lucre_sum: number;

  editData: Item;
  data: Date;
  radioDisabled: boolean = false;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';

  @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
  @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

  constructor(
    private electronService: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: ForgingWorksService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
  ) {
    // 접근권한 체크
    if (route.routeConfig.path && ('id' in route.routeConfig.data)) {
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
      input_date: ['', Validators.required],
      poc_no: ['', Validators.required],
      production_line: ['', Validators.required],
      working_group: ['', Validators.required],
      product_code: ['', Validators.required],
      product_name: ['', Validators.required],
      material: '',
      size: '',
      defective_qty: ['', Validators.required],
      defective_classification: '',
      loss_qty: ['', Validators.required],
      lucre_qty: ['', Validators.required],
      order_qty: ['', Validators.required],
      assembly_qty: ['', Validators.required],
      assembly_sum: '',
      defective_sum: '',
      loss_sum: '',
      lucre_sum: '',
      more_less_qty: '',
      working_sday: '',
      working_shour: '',
      working_smin: '',
      working_eday: '',
      working_ehour: '',
      working_emin: '',
      working_time: '',
      preparation_time: '',
      meal_time: '',
      failure_time: '',
      stop_time: '',
      real_working_time: ''
    });
  }

  ngOnInit() {
    this.panelTitle = '조립작업실적 입력';
    this.inputForm.controls['input_date'].setValue(this.tDate);
  }

  onValueChange(value: Date): void {
    this.inputForm.patchValue({promised_date: value});
  }

  Save() {
    if (this.isExecutable == false) {
      alert(this.globals.isNotExecutable);
      return false;
    }

    let f = this.inputForm.value;
    if (!f.production_line) {
      alert('작업라인을 선택해주세요!');
      return false;
    }

    f.input_date = this.datePipe.transform(f.input_date, 'yyyy-MM-dd');

    // 불량일 경우 불량내용 체크
    f.defective_classification = f.defective_classification * 1;
    if (f.result_classification == 'DEFECTIVE' && f.defective_classification == 0) {
      alert('불량내용을 선택해주세요!');
      return false;
    }

    // 정상일 경우 시간 입력됬는지 체크
    if (f.result_classification == 'NORMAL') {
      if (f.working_sday == '' || f.working_shour == '' || f.working_smin == '') {
        alert('시작시간을 입력해주세요!');
        return false;
      }
      if (f.working_eday == '' || f.working_ehour == '' || f.working_emin == '') {
        alert('종료시간을 입력해주세요!');
        return false;
      }
      f.working_stime = this.datePipe.transform(f.working_sday, 'yyyy-MM-dd') + ' ' + f.working_shour + ':' + f.working_smin + ':00';
      f.working_etime = this.datePipe.transform(f.working_eday, 'yyyy-MM-dd') + ' ' + f.working_ehour + ':' + f.working_emin + ':00';
    } else {
      f.working_stime = this.datePipe.transform(f.working_sday, 'yyyy-MM-dd') + ' 00:00:00';
      f.working_etime = this.datePipe.transform(f.working_eday, 'yyyy-MM-dd') + ' 00:00:00';
    }

    f.defective_qty = this.utils.removeComma(f.defective_qty) * 1;
    f.loss_qty = this.utils.removeComma(f.loss_qty) * 1;
    f.lucre_qty = this.utils.removeComma(f.lucre_qty) * 1;
    f.order_qty = this.utils.removeComma(f.order_qty) * 1;
    f.assembly_qty = this.utils.removeComma(f.assembly_qty) * 1;
    console.log("AAAAAAAAAAAA");
    console.log(f.assembly_qty);
    console.log("AAAAAAAAAAAA");
    f.assembly_sum = this.utils.removeComma(f.assembly_sum) * 1;
    f.defective_sum = this.utils.removeComma(f.defective_sum) * 1;
    f.loss_sum = this.utils.removeComma(f.loss_sum) * 1;
    f.lucre_sum = this.utils.removeComma(f.lucre_sum) * 1;
    f.more_less_qty = f.assembly_qty - f.assembly_sum - f.loss_sum + f.lucre_sum;

    f.working_time = f.working_time * 1;
    f.preparation_time = f.preparation_time * 1;
    f.meal_time = f.meal_time * 1;
    f.failure_time = f.failure_time * 1;
    f.stop_time = f.stop_time * 1;
    f.real_working_time = f.real_working_time * 1;

    this.Create(f);
  }

  Reset() {
    this.inputForm.reset();
  }

  Create(data): void {
    console.log(data);
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.inputForm.reset();
            this.inputForm.controls['input_date'].setValue(this.tDate);
            this.messageService.add(this.addOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
        },
        error => this.errorMessage = <any>error
      );
  }

  openModal(method) {
    // 실행권한
    if (this.isExecutable == true && method == 'upload') {
      this.uploadFormModal.show();
    } else {
      alert(this.globals.isNotExecutable);
      return false;
    }
  }

  loadInfo(event) {
    let PocNo = event.target.value;
    if (!PocNo) {
      return false;
    }

    this.dataService.GetById(PocNo).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];

          this.orig_defective_sum = this.formData.defective_sum;
          this.orig_loss_sum = this.formData.loss_sum;
          this.orig_lucre_sum = this.formData.lucre_sum;

          let order_qty = this.utils.addComma(this.formData.order_qty);
          let assembly_qty = this.utils.addComma(this.formData.assembly_qty);
          let assembly_sum = this.utils.addComma(this.formData.assembly_sum);
          let defective_sum = this.utils.addComma(this.formData.defective_sum);
          let loss_sum = this.utils.addComma(this.formData.loss_sum);
          let lucre_sum = this.utils.addComma(this.formData.lucre_sum);

          let more_less_sum = this.formData.assembly_qty - this.formData.assembly_sum - this.formData.defective_sum - this.formData.loss_sum + this.formData.lucre_sum;

          this.inputForm.patchValue({
            production_line: this.formData.production_line,
            product_code: this.formData.product_code,
            product_name: this.formData.product_name,
            order_qty: order_qty,
            assembly_qty: assembly_qty,
            assembly_sum: assembly_sum,
            defective_sum: defective_sum,
            loss_sum: loss_sum,
            lucre_sum: lucre_sum,
            more_less_qty: this.utils.addComma(more_less_sum)
          });
        }
      }
    );
  }

  CalculSum(): void {
    let f = this.inputForm.value;

    let defective_qty = this.utils.removeComma(f.defective_qty) * 1;
    let loss_qty = this.utils.removeComma(f.loss_qty) * 1;
    let lucre_qty = this.utils.removeComma(f.lucre_qty) * 1;

    let order_qty = this.utils.removeComma(f.order_qty) * 1;
    let assembly_qty = this.utils.removeComma(f.assembly_qty) * 1;

    let assembly_sum = this.orig_assembly_sum + assembly_qty;
    let defective_sum = this.orig_defective_sum + defective_qty;
    let loss_sum = this.orig_loss_sum + loss_qty;
    let lucre_sum = this.orig_lucre_sum + lucre_qty;

    let more_less_qty = assembly_qty - assembly_sum - defective_sum - loss_sum + lucre_sum;

    this.inputForm.patchValue({
      assembly_sum: this.utils.addComma(assembly_sum),
      defective_sum: this.utils.addComma(defective_sum),
      loss_sum: this.utils.addComma(loss_sum),
      lucre_sum: this.utils.addComma(lucre_sum),
      more_less_qty: this.utils.addComma(more_less_qty)
    });
  }

  GetWorkingTime(groupNo) {
    let formData = this.inputForm.value;
    if (!formData.input_date) {
      alert('작업일자를 입력해주세요!');
      return false;
    }
    if (!formData.production_line) {
      alert('작업라인을 선택해주세요!');
      return false;
    }
    if (!formData.product_code) {
      alert('제품코드를 입력해주세요!');
      return false;
    }
    let data = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd') + '::' + formData.production_line + '::' + groupNo + '::' + formData.product_code;
    // 제품정보
    this.dataService.GetWorkingTime(data).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];

          let st = this.formData.working_stime.split(':');
          let et = this.formData.working_etime.split(':');

          //let working_time = this.CalculWorkingTime(this.formData.working_sday, st[0], st[1], this.formData.working_eday, et[0], et[1]);
          //let real_working_time = working_time - this.formData.preparation_time - this.formData.meal_time;

          this.inputForm.patchValue({
            working_sday: this.formData.working_sday,
            // working_sday: this.formData.working_sday,
            // working_shour: st[0],
            // working_smin: st[1],
            working_eday: this.formData.working_sday,
            // working_eday: this.formData.working_eday,
            // working_ehour: et[0],
            // working_emin: et[1],
            //working_time: working_time,
            preparation_time: this.formData.preparation_time,
            meal_time: this.formData.meal_time,
            failure_time: 0,
            stop_time: 0//,
            //real_working_time: real_working_time
          });
        }
      }
    );
  }

  CalculWorkingTime(sday, shour, smin, eday, ehour, emin) {
    if (!sday || !shour || !smin || !eday || !ehour || !emin) {
      return 0;
    }
    let ssec = this.DateToTime(sday, shour, smin);
    let esec = this.DateToTime(eday, ehour, emin);
    let result = (esec - ssec) / 60; // sec(초)를 min(분)으로 환산
    if (result > 1440) {
      // 1일 이상 차이나면 종료시간을 수정한 것으로 간주함.
      // 근무패턴등록에 1일 이상 차이나는 경우는 없음.
      result = result - 1440;
    }
    return result;
  }

  DateToTime(d, h, m) {
    let dArr = d.split('-');
    let dt = new Date(Number(dArr[0]), Number(dArr[1]), Number(dArr[2]), h, m);
    return new Date(dt).getTime() / 1000;
  }

  CalculRealWorkingTime(): void {
    let f = this.inputForm.value;
    let working_time = this.CalculWorkingTime(this.datePipe.transform(f.working_sday, 'yyyy-MM-dd'), f.working_shour, f.working_smin, this.datePipe.transform(f.working_eday, 'yyyy-MM-dd'), f.working_ehour, f.working_emin);
    let real_working_time = working_time - f.preparation_time - f.meal_time - f.failure_time - f.stop_time;
    this.inputForm.patchValue({
      working_time: working_time,
      real_working_time: real_working_time
    });
  }

  IsNeedWorkingTime(resultClassification) {
    if (resultClassification == 'NORMAL') {
      let formData = this.inputForm.value;
      this.GetWorkingTime(formData.working_group);
    } else {
      this.inputForm.patchValue({
        working_time: '',
        preparation_time: '',
        meal_time: '',
        failure_time: '',
        stop_time: '',
        real_working_time: ''
      });
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
        importedSaveAs(res, '절단재고현황.xlsx');

        let win = this.electronService.remote.getCurrentWindow();

        win.webContents.session.on('will-download', (event, item, webContents) => {
          // Set the save path, making Electron not to prompt a save dialog.
          //item.setSavePath('d:\project\원자재마스터.xlsx')
          //item.setSavePath('d:\\project\\원자재마스터.xlsx');

          const filename = item.getFilename();

          item.on('updated', (event, state) => {
            if (state === 'interrupted') {
              console.log('Download is interrupted but can be resumed');
            } else if (state === 'progressing') {
              if (item.isPaused()) {
                console.log('Download is paused');
              } else {
                console.log(`Received bytes: ${item.getReceivedBytes()}`);
              }
            }
          });
          item.once('done', (event, state) => {
            if (state === 'completed') {
              console.log(filename + ' 저장 완료');
              this.uploadFormModal.hide();
            } else {
              alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
              console.log(`Download failed: ${state}`);
            }
          });
        });
      },
      error => this.errorMessage = <any>error
    );
    //}
  }

  fileSelected(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      let formData: FormData = new FormData();
      formData.append('uploadFile', file, file.name);

      this.excelUpload(formData);
    }
  }

  excelUpload(data): void {
    this.isLoadingProgress = true;
    this.dataService.UploadExcelFile(data).subscribe(
      data => {
        if (data['result'] == 'success') {
          this.inputForm.reset();
          this.isLoadingProgress = false;
          this.messageService.add(this.addOkMsg);
        } else {
          this.messageService.add(data['errorMessage']);
        }
        this.uploadFormModal.hide();
      },
      error => this.errorMessage = <any>error
    );
  }
}
