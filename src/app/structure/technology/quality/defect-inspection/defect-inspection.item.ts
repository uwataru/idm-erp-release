export class Item {
    //id: number;
    totalCount: number;
    data: {
        product_code: number;
        product_name: string;
        drawing_no: string;
        poc_no: string;
        production_date: string;
        production_qty: number;
        inspection_classification: number;
        defective_qty: number;
        defective_classification: number;
        refer_etc: string;
        inspector: string;
        inspection_date: string;
        input_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
