import { Device, TRANSCIEVER_TYPE } from "./device.class";
import { SleepCfg } from "./sleepcfg.class";

export class Transceiver {
   public id: string;
   public infos: Device;
   public sleepCfg: SleepCfg;
   public links: Array<any>;
   public routings: Array<any>;
   public iOCfg: Array<any>;

   constructor(data: any) {
      this.decodeInput(data);
   }

   public decodeInput(data: any): void {
      if (!this.infos) {
         this.id = data.remote64 || data.sender64;
         this.infos = new Device();
      }
      this.infos.address64 = data.remote64 || data.sender64;
      this.infos.address16 = data.remote16 || data.sender16;
      this.infos.type =  data.deviceType ;
      this.infos.nodeIdentifier = data.nodeIdentifier;
      this.infos.remoteParent16 = data.remoteParent16;
      this.infos.digiProfileID = data.digiProfileID;
      this.infos.digiManufacturerID = data.digiManufacturerID;
   }

   public setsleepCfg(data): SleepCfg {
      if (!this.sleepCfg) {
         this.sleepCfg = new SleepCfg();
      }
      this.sleepCfg.decodeInput(data);
      return this.sleepCfg;
   }
}

export enum DECODE_TYPE {
   NODE_IDENTIFICATOR = 0,
   NODE_DISCOVERING,
   SCAN
}
