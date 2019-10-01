export class Item {
    totalCount: number;
    data: {
        acct_code: string;
        mgmt_item_value_no: number;
        mgmt_item_value_name: string;
        mgmt_item_value_name_alias: string;
        mgmt_item_no: number;
        mgmt_item_name: string;
        input_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
