export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    order_no: string;
    partner_name: string;
    product_name: string;
    product_type: string;
    line_no: string;
    promised_date: string;
    start_date: string;
    qty: number;
    production_qty: number;
    production_date: string;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
