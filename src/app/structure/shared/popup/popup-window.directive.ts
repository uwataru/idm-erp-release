import { Directive, Component, Input, HostListener } from '@angular/core';
import { WindowRefService } from './window-ref.service';

@Directive({
    selector: '[appPopupWindow]',
    providers: [WindowRefService]
})

export class PopupWindowDirective {
    nativeWindow: any;
    constructor( private winRef: WindowRefService ) {
        this.nativeWindow = winRef.getNativeWindow();
    }

    @Input('popWinURL') url: any;
    @Input('popWinOptions') options: any;
    @HostListener('click',['$event']) onClick() {
        if (this.options != '') {
            this.options = this.checkOptions(this.options) + ', location=no, directories=no, resizable=no, status=no, toolbar=no, menubar=no';
        }
        var newWindow = this.nativeWindow.open(this.url, '_blank', this.options);
        newWindow.location = this.url;
    }

    checkOptions(str) {
        var autoSizeWidth = this.nativeWindow.screen.width - 38;
        var autoSizeHeight = this.nativeWindow.screen.height - 130;
        var arr = str.split(',');
        var newArr = new Array();
        var newStr: string;
        for (var i=0; i<arr.length; i++) {
            newStr = arr[i].replace(' ','');
            if (newStr == 'width=auto') {
                newStr = 'width=' + autoSizeWidth;
            }
            if (newStr == 'height=auto') {
                newStr = 'height=' + autoSizeHeight;
            }
            if (newStr == 'top=auto') {
                newStr = 'top=10';
            }
            if (newStr == 'left=auto') {
                newStr = 'left=10';
            }
            newArr.push(newStr);
        }

        return newArr.join(',');
    }
}
