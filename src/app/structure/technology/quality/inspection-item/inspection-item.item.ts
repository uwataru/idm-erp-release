export class Item {
  totalCount: number;
  data: {
    id: number;
    production_date: string;
    taken: number;
    crack: number;
    print_faulty: number;
    color_faulty: number;
    cosmetic_faulty: number;
    etc: number;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}

