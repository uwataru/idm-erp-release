export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        grp_name: string;
        cfg_code: string;
        cfg_name: string;
        accessible_users: string;
        executable_users: string;
        printable_users: string;
        approval_step: string;

        menu_id: number;
        auth_type: string;
        users: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
