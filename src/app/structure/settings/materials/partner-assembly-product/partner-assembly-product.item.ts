export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    input_date: string;
    name: string;
    partner_id: number;
    partner_name: string;
    partner_alias: string;
    price: number;
    price_date: string;
    size: string;
    st: number;
    is_type: boolean;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}

export class PartnerItem {
  partner_code: string;
  partner_name: string;
}
