export class Item {
  //id: number;
  totalCount: number;
  data: {
      id: number;
      name: string;
      is_type: boolean;
      partner_id: number;
      partner_name: string;
      price: number;
      receiving_price: number;
      size: string;
      order_type: boolean;
      order_price: number;
      material_id: number;
      order_qty: number;
      receiving_qty: number;
      promised_date: string;
      receiving_date: string;
      receiving_location_id: number;
      input_date: string;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
