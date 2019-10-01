import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
@Directive({
    selector: '[nextFocus]'
})
export class NextFocusDirective {
    private el: ElementRef;
    @Input('nextFocus') nextControl: string;
    constructor(private _el: ElementRef,public renderer: Renderer2) {
        this.el = this._el;
    }
    @HostListener('keydown', ['$event']) onKeyDown(e:any) {
        if ((e.which == 13 || e.keyCode == 13)) {
            e.preventDefault();
            document.getElementById(this.nextControl).focus();
        }
    }
}
