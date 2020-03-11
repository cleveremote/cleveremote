
export interface ISynchronize {
    synchronize(data: ISynchronizeParams): any;
}

export interface ISynchronizeParams {
    entity: string;
    data: any;
    action: string;
}

export interface IPartitionTopic {
    rangePartitions: Array<number>;
    current: number;
}

export interface IPartitionConfig {
    configId: string;
    startRange: number;
    endRange: number;
}

export interface ITopic {
    box?: string;
    name: string;
    partitionTopic?: IPartitionTopic;
}

export interface IUser {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    account?: IAccount;
    providers?: Array<IProvider>;
}

export interface IAccount {
    accountId: string;
    name: string;
    description?: string;
    users: Array<IUser>;
    devices: Array<IDevice>;
}

export interface IDevice {
    deviceId: string;
    name: string;
    description?: string;
    account: IAccount;
    config: IPartitionTopic;
}

export interface IProvider {
    providerId: string;
    user?: IUser;
    provider: string;
    providerUid: string;
}

export interface ITransceiver {
    transceiverId: string;
    name: string;
    description: string | null;
    address: string;
    type: string;
    configuration: string;
    device: IDevice | null;
}
