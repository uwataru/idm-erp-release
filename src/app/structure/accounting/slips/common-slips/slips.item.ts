export class Item {
    totalCount: number;
    data: {
        entry_no: number;
        acct_code: string;
        acct_name: string;
        dr_cr: string;
        amount: number;
        brief_summary: string;
    };
    items: {
        slips_id: number;
        item_code: string;
        item_value_code: number;
        item_value_text: string;
    }
    searchData: {
        slip_no: string;
        createdAt: string;
        updatedAt: string;
    }
    slipNo: string;
    drAmountSum: number;
    crAmountSum: number;
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
