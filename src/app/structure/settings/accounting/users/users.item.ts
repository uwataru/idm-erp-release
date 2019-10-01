export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        user_id: string;
        user_pw: string;
        user_name: string;
        dept_name: string;
        position_name: string;
        user_email: string;
        user_phone: string;
        user_addr: string;
        joining_date: string;
        retirement_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
