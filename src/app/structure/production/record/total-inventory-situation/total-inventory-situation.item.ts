export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        poc_no: string;
        product_code: string;

        product_name: string;
        material: string;
        input_date: string;
        production_qty: number;

        assembly_id: number;
        order_date: string;
        heat_treatment_process: string;
        heat_treatment_criteria: string;
    };
    heatTreatmentProcess: string;
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
