import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MessagesComponent } from './messages/messages.component';
import { NextFocusDirective } from './forms/nextfocus.directive';
import { SearchPipe } from './forms/search.pipe';
import { PopupWindowDirective } from './popup/popup-window.directive';
import { NumberFormatPipe } from './number-format.pipe'
import { KeysPipe } from './keys.pipe'
import { DecimalMask } from './decimal-mask.directive'

@NgModule({
    declarations: [
        MessagesComponent,
        NextFocusDirective,
        SearchPipe,
        PopupWindowDirective,
        NumberFormatPipe,
        KeysPipe,
        DecimalMask
    ],
    imports: [
        CommonModule
    ],
    exports: [
        MessagesComponent,
        NextFocusDirective,
        SearchPipe,
        PopupWindowDirective,
        NumberFormatPipe,
        KeysPipe,
        DecimalMask
    ]
})
export class SharedModule { }
