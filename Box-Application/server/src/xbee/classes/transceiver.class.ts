import { Device, TRANSCIEVER_TYPE, TRANSCIEVER_STATUS } from "./device.class";
import { SleepCfg } from "./sleepcfg.class";
import { IOCfg } from "./iocfg.class";

export class Transceiver {
   public id: string;
   public infos: Device;

   public routings: Array<any>;


   /////////////////

   public address64: string | ArrayBuffer;
   public address16: string | ArrayBuffer;
   public type: TRANSCIEVER_TYPE;
   public status: TRANSCIEVER_STATUS;
   public lastSeen: Date;
   public powerSupply: number;

   public sleepCfg: SleepCfg;
   public iOCfg: IOCfg;
   public links: Array<any>;

   /////////////////
   constructor(data?: any) {
      if (data) {
         this.decodeInput(data);
      } 
   }

   public decodeInput(data: any): void {
      if (!this.infos) {
         this.id = data.remote64 || data.sender64;
         this.infos = new Device();
      }
      this.infos.address64 = data.remote64 || data.sender64;
      this.infos.address16 = data.remote16 || data.sender16;
      this.infos.type = data.deviceType;
      this.infos.nodeIdentifier = data.nodeIdentifier;
      this.infos.remoteParent16 = data.remoteParent16;
      this.infos.digiProfileID = data.digiProfileID;
      this.infos.digiManufacturerID = data.digiManufacturerID;
   }

   // public setsleepCfg(data): SleepCfg {
   //    if (!this.sleepCfg) {
   //       this.sleepCfg = new SleepCfg();
   //    }
   //    this.sleepCfg.setConfig(data);
   //    return this.sleepCfg;
   // }
}

export enum DECODE_TYPE {
   NODE_IDENTIFICATOR = 0,
   NODE_DISCOVERING,
   SCAN
}
