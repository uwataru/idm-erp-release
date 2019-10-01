import { Pipe, PipeTransform } from "@angular/core";

const PADDING = "000000";   // Pipe 와 export 사이에 넣으면 Decorators are not valid here 라는 오류 발생

@Pipe({name: 'numberFormat'})
export class NumberFormatPipe implements PipeTransform {

    THOUSANDS_SEPARATOR: string;
    DECIMAL_SEPARATOR: string;

    constructor() {
        this.THOUSANDS_SEPARATOR = ",";
        this.DECIMAL_SEPARATOR = ".";
    }

    transform(value: number | string, fractionSize: number = 0): string {
        if(value === 0 || value === "0")
            return "0";

        let [ integer, fraction = "" ] = (value || "").toString().split(this.DECIMAL_SEPARATOR);

        fraction = fractionSize > 0
            ? this.DECIMAL_SEPARATOR + (fraction + PADDING).substring(0, fractionSize)
            : "";

        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, this.THOUSANDS_SEPARATOR);

        return integer + fraction;
    }

    parse(value: string, fractionSize: number = 0): string {
        if(value === "0")
            return "0";

        let [ integer, fraction = "" ] = (value || "").split(this.DECIMAL_SEPARATOR);

        integer = integer.replace(new RegExp(this.THOUSANDS_SEPARATOR, "g"), "");

        fraction = parseInt(fraction, 10) > 0 && fractionSize > 0
            ? this.DECIMAL_SEPARATOR + (fraction + PADDING).substring(0, fractionSize)
            : "";

        return integer + fraction;
    }

}
