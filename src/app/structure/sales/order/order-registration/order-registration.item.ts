export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    product_code: string;
    input_date: string;
    order_type1: string;
    order_type2: string;
    partner_code: number;
    partner_name: string;
    product_name: string;
    delivery_date: string;
    size: number;
    promised_date: string;
    production_line: string;
    product_price: number;
    order_qty: number;
    order_no: string;
    is_tmp_price: string;
    modi_reason: string;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
