
import { DeviceExt } from "../repositories/device.ext";
import { TransceiverExt } from "../repositories/transceiver.ext";
import { PartitionConfigExt } from "../repositories/partitionConfig.ext";
import { AccountExt } from "../../authentication/repositories/account.ext";
import { UserExt } from "../../authentication/repositories/user.ext";

export class LoggerService {
    public classStore = [
        DeviceExt,
        AccountExt,
        UserExt,
        TransceiverExt,
        PartitionConfigExt
    ];

    public dynamicType(entityName: string): any {
        const className = `Ext${entityName}`;
        if (this.classStore[className] === undefined || this.classStore[className] === null) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }

        return this.classStore[className];
    }

    public logSynchronize(): void {
    }

}
