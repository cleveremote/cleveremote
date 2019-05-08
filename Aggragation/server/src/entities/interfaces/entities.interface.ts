export interface IUser {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    number_phone: string;
    password: string;
    account?: IAccount;
    providers?: Array<IProvider>;
}

export interface IAccount {
    account_id: string;
    name: string;
    description?: string;
    device?: IDevice;
    users: Array<IUser>;
}

export interface IDevice {
    device_id: string;
    name: string;
    description?: string;
    accounts: Array<IAccount>;
}

export interface IProvider {
    provider_id: string;
    user?: IUser;
    provider: string;
    provider_uid: string;
}
