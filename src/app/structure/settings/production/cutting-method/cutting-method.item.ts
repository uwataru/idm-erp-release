export class Item {
    totalCount: number;
    data: {
        cfg_id: number;
        code: string;
        assembly_method: string;
        working_group: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
