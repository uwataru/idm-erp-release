export class Item {
    totalCount: number;
    data: {
        id: number;
        group: string;
        name: string;
        phone: number;
        working_time: number;
        work_skill: string;
        input_process: string;
        input_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
