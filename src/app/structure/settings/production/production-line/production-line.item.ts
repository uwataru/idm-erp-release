export class Item {
    totalCount: number;
    data: {
        id: number;
        line_code: string;
        main_process: string;
        run_time: number;
        worker_cnt: number;
        is_outs: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
