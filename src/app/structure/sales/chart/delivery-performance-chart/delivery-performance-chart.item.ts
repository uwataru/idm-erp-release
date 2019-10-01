export class Item {
    yearmonth: string;
    planned_sales_amount: number;

    labels: Array<string>;
    rows: Array<string>;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}
