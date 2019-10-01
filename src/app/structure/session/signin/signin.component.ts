import { Component, Inject, OnInit } from '@angular/core';
import { ElectronService } from '../../../providers/electron.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../user.service';
import { AppGlobals } from '../../../app.globals';
import { MessageService } from '../../../message.service';
import { AppConfig } from '../../../../environments/environment';

export class User {
    user_id: string;
    user_name: string;
    position_name: string;
    token: string;
}

@Component({
    selector: 'app-auth',
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss'],
    providers: [UserService]
})
export class SignInComponent implements OnInit {
    loading = false;
    returnUrl: string;
    loginForm: FormGroup;
    loginOkMsg: string = '로그인되었습니다.';
    errorMessage: string;
    user = new User();
    version = AppConfig.VERSION;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private electronService: ElectronService,
        private router: Router,
        private dataService: UserService,
        private globals: AppGlobals,
        private messageService: MessageService
    ) {
        // 입력폼 필드 초기화
        this.loginForm = fb.group({
            login_id: ['', Validators.required],
            login_pw: ['', Validators.required]
        });
    }

    ngOnInit() {

        this.dataService.logout();
      if(!AppConfig.production){
        let formData = this.loginForm.value;
        formData.login_id='master';
        formData.login_pw='1111';
        this.loginCheck();
      }

    }

    loginCheck () {
        let formData = this.loginForm.value;

        if ( formData.login_id == '') {
            this.messageService.add('아이디를 입력해주세요.');
            return false;
        }

        if ( formData.login_pw == '') {
            this.messageService.add('비밀번호를 입력해주세요.');
            return false;
        }

        this.Login(formData);
    }

    Login (data): void {
        this.loading = true;
        this.dataService.login(data)
            .subscribe(
                data => {
                    this.loading = false;
                    if (data['result'] == 'success') {
                        this.user = data['user'];
                        if (this.user && this.user.token) {
                            // store user details and jwt token in local storage to keep user logged in between page refreshes
                            sessionStorage.setItem('currentUser', JSON.stringify(this.user));
                            this.globals.userId = this.user.user_id;
                            this.globals.userName = this.user.user_name;
                            this.globals.userPosition = this.user.position_name;
                            this.globals.userPermission = data['permissions'];
                            this.globals.isDevIP = data['isDevIP'];
                            this.loginForm.reset();
                            this.messageService.add(this.loginOkMsg);
                            this.router.navigate(['/']);
                            this.electronService.setDevTool();
                        } else {
                            this.messageService.add(data['errorMessage']);
                        }
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }

                },
                error => this.errorMessage = <any>error
            );
    }

}
