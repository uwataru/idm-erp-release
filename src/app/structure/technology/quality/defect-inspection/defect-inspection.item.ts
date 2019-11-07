export class Item {
  //id: number;
  totalCount: number;
  data: {
    order_no: string;
    product_code: number;
    product_name: string;
    production_date: string;
    production_qty: number;
    normal_qty: number;
    inspection_classification: number;
    defective_qty: number;
    defective_classification: number;
    refer_etc: string;
    inspector: string;
    inspection_date: string;
    input_date: string;
    screening_qty: number;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
