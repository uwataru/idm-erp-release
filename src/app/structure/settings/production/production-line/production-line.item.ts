export class Item {
    totalCount: number;
    data: {
        id: number;
        line_no: string;
        process_id: number;
        run_time: number;
        worker_cnt: number;
        is_outsourcing: string;
        process_code: string;
        process_group: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
