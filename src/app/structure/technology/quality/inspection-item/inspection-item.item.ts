export class Item {
    totalCount: number;
    data: {
        id: number;
        production_date: string;
        taken: number;
        crack: number;
        printfaulty: number;
        colorfaulty: number;
        cosmeticfaulty: number;
        etc: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}