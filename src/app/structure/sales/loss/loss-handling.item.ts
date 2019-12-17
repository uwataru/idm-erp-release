export class Item {
    //id: number;
    totalCount: number;
    data: {
      id: number;
      product_name: string;
      product_type: string;
      input_date: string;
      product_id: number;
      order_qty: number;
      transfer_qty: number;
      production_qty: number;
      sales_qty: number;
      defect_qty: number;
      loss_qty: number;
      st: number;
      total_qty: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
  }
  
  