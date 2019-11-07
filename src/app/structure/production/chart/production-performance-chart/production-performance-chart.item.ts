export class Item {
    yearmonth: string;
    target_production_qty: number;
    target_production_amount: number;

    labels: Array<string>;
    rows: Array<string>;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}
