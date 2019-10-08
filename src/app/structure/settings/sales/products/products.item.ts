export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    input_date: string;
    partner_code: string;
    partner_name: string;
    product_code: string;
    is_combi: string;
    product_type: string;
    product_name: string;
    product_price: number;
    is_tmp_price: string;
    size: number;
    st: number;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}

export class PartnerItem {
  partner_code: string;
  partner_name: string;
}
