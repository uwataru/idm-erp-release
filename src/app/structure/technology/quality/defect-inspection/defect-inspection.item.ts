export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    sales_orders_detail_id: number,
    production_date: string,
    assembly_performance_id: number,
    order_no: number,
    product_name: string,
    product_type: string,
    production_qty: string,
    material_name: string,
    material_id: number,
    qty: number,
    defect_content: string,
    defect_content_id: number,
    etc: string,
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
