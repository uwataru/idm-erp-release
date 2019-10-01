import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'partners'
})
export class SearchPipe implements PipeTransform {
    transform(partners: any, searchValue: any): any {
        console.log(searchValue);
        if (searchValue == null) return partners;

        return partners.filter(function(partners){
            return partners.Name.indexOf(searchValue) > -1;
        })
    }
}
