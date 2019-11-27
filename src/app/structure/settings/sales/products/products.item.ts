export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        input_date: string;
        name: string;
        type: string;
        product_price: number;
        is_tmp_price: string;
        materials: any[];
        assembly_method: string;
        st: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
