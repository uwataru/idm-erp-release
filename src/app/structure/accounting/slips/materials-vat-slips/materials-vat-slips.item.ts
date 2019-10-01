export class Item {
    totalCount: number;
    data: {
        id: number;
        partner_name: string;
        amount: string;
        vat_amount: string;
        slip_no: string;
        brief_summary: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
