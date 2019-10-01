export class Item {
    totalCount: number;
    data: {
        acct_code: number;
        acct_name: string;
        mgmt_item1: number;
        mgmt_item2: number;
        mgmt_item3: number;
        mgmt_item4: number;
        output_tb: string;
        output_pp: string;
        input_date: string;
        mgmt_item1_name: string;
        mgmt_item2_name: string;
        mgmt_item3_name: string;
        mgmt_item4_name: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
