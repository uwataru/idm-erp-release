export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: string;
        input_date: string;
        ptype1: boolean;
        ptype2: boolean;
        ptype3: boolean;
        ptype4: boolean;
        ptype5: boolean;
        ptype6: boolean;
        biz_no: string;
        name: string;
        alias: string;
        code: string;
        ceo: string;
        addr1: string;
        addr2: string;
        zipcode: string;
        zipcode2: string;
        mobile: string;
        email: string;
        phone: string;
        fax: string;
        country: string;
        costumer: string;
        biz_cate1: string;
        biz_cate2: '',
        st: number
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
