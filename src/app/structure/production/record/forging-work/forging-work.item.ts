export class ViewData {
  product_code: string;
  product_name: string;
  drawing_no: string;
  partner_name: string;
  sch_sdate: string;
  sch_edate: string;

  constructor() {
  }
}

export class RowData {
  line_code: number;
  order_no: string;
  delivery_no: number;
  product_code: string;
  product_name: string;
  production_line: string;
  drawing_no: string;
  partner_code: number;
  partner_name: string;
  poc_no: string;
  sales_qty: number;
  product_price: number;
  sales_price: number;
  sales_date: string;
  delivery_date: string;

  constructor() {
  }
}

export class SumData {
  prev_cutting_qty: number;
  cutting_qty: number;
  prev_assembly_qty: number;
  assembly_qty: number;
  forwarding_weight: number;
  forging_qty: number;
  defective_qty: number;
  loss_qty: number;
  lucre_qty: number;
  inventory_qty: number;

  constructor() {
  }
}

export class Item {
  //id: number;
  totalCount: number;
  viewData: ViewData;
  rowData: RowData;
  sumData: SumData;
  maxResultCount: number;
  result: string;
  errorMessage: string;

  constructor() {
  }
}
