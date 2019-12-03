export class Item {
    //id: number;
    totalCount: number;
    data: {
        order_no: string;
        product_name: string;
        product_type: string;
        name: string;
        qty: number;
        price: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
