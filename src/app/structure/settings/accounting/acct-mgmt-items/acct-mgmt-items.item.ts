export class Item {
    totalCount: number;
    currentPeriodId: number;
    data: {
        mgmt_item_no: number;
        mgmt_item_name: string;
        use_item_values: number;
        use_item_balance: number;
        input_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
