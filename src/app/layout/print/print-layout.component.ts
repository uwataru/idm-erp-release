import { Component,ViewEncapsulation, Input,Output,OnChanges,ElementRef, EventEmitter } from '@angular/core';

@Component({
    selector: 'print-layout',
    templateUrl: './print-layout.component.html',
    styleUrls: ['./print-layout.component.css']
})

export class PrintLayoutComponent implements OnChanges {

    @Input('section') section:string;
    @Output() sectionChange = new EventEmitter<any>();

    constructor(private ele:ElementRef) {
        if(this.section===undefined)
            this.section = 'printpage';
    }

    ngOnChanges(changes) {
        if(changes.section && changes.section.currentValue!==undefined
        && changes.section.currentValue!==''){

        }
    }

    afterPrint() {
        console.log("after print");
        this.ele.nativeElement.children[0].innerHTML = '';
        this.sectionChange.emit('');
        this.section = '';
    }

    printDiv() {
        if(this.section && this.section != undefined && this.section!='') {
            var printContents = document.getElementById(this.section).innerHTML;
            var originalContents = document.body.innerHTML;

            if(window) {
                if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
                    var popup = window.open('', '_blank',
                    'width=800,height=600,scrollbars=no,menubar=no,toolbar=no,'
                    +'location=no,status=no,titlebar=no');

                    popup.window.focus();
                    popup.document.write('<!DOCTYPE html><html><head>  '
            +'<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.css" '
            +'media="screen,print">'
            +'<link rel="stylesheet" href="style.css" media="screen,print">'
            +'<style>'
            +'@page a4sheet { size:22.0cm 29.7cm }'
            +'.a4 { page:a4sheet; page-break-after:always; }'
            +'</style>'
            +    '</head><body onload="window.print()"><div class="reward-body">'
            + printContents + '</div></html>');
                    popup.onbeforeunload = function (event) {
                        popup.close();
                        return '.\n';
                    };
                    popup.onabort = function (event) {
                        popup.document.close();
                        popup.close();
                    }
                } else {
                    var popup = window.open('', '_blank', 'width=800,height=600');
                    popup.document.open();
                    popup.document.write('<html><head>'+
            +'<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.css"'
            +' media="all">'
            +'<link rel="stylesheet" href="style.css" media="all">'
            +'</head><body onload="window.print()">' + printContents + '</html>');
                    popup.document.close();
                }

                popup.document.close();
            }
            return true;
        }
    }

    fetchStylesheets() {
        var output:string= '';
        for(var i=0;i<document.styleSheets.length;i++){
            output = output +' <link rel="stylesheet" type="text/css" href="'+
                window.document.styleSheets[0].href +'" /> ';
        }
        return output;
    }

    fetchscriptSheets() {
        var output:string= '';
        for(var i=0;i<document.scripts.length;i++){
            output = output +' <script type="text/javascript" src="'+
                window.document.scripts[0].src +'" /> ';
        }
        return output;
    }

}
