export class Item {
    totalCount: number;
    data: {
        id: number;
        group_id: string;
        group_name: string;
        name: string;
        employee_num: string;
        phone: string;
        addr: string;
        specialnote: string;
        // working_time: number;
        // work_skill: string;
        // input_process: string;
        input_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}