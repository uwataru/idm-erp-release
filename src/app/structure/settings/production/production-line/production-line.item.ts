export class Item {
    totalCount: number;
    data: {
        id: number;
        line_code: string;
        equipment_name: string;
        efficiency: number;
        equipment_maker: string;
        worker_cnt: number;
        electric_furnace_capacity: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
