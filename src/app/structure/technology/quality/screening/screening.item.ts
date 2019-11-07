export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        assembly_id: number;
        poc_no: string;
        line_code: string;
        product_code: string;
        product_name: string;
        screening: string;
        input_date: string;
        production_qty: number;
        screening_qty: number;
        screeningQty: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
