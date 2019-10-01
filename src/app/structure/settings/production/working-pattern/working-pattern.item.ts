export class Item {
    totalCount: number;
    currentPeriodId: number;
    data: {
        id: number;
        pattern_code: string;
        working_group: string;
        working_hours: number;
        group1_stime: string;
        group1_etime: string;
        group1_etime_is_nextday: string;
        group1_working_time: number;
        group2_stime: string;
        group2_etime: string;
        group2_etime_is_nextday: string;
        group2_working_time: number;
        group3_stime: string;
        group3_etime: string;
        group3_etime_is_nextday: string;
        group3_working_time: number;
        working_time_per_day: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
