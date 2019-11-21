export class Item {
  totalCount: number;
  data: {
    id: number;
    code: string;
    assembly_type: string;
    group: string;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
