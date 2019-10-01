export class Item {
    totalCount: number;
    currentPeriodId: number;
    data: {
        id: number;
        input_date: string;
        start_date: string;
        end_date: string;
        workers: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
