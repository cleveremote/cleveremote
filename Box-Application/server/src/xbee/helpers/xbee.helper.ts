import { differenceObject } from "./deep-compare-objects.helper";

export class XbeeHelper {
    public static position = 0;


    public static routingTable(buffer): { [s: string]: number | string } {
        const position = 0;
        const idObj = XbeeHelper.readUInt8(buffer, position);
        const statusObj = XbeeHelper.readUInt8(buffer, idObj.position);
        const routingtableentriesObj = XbeeHelper.readUInt8(buffer, statusObj.position);
        const startindexObj = XbeeHelper.readUInt8(buffer, routingtableentriesObj.position);
        const routingtablelistcountObj = XbeeHelper.readUInt8(buffer, startindexObj.position);
        const routingtablelistObj = XbeeHelper.readListRoutingTable(buffer, Number(routingtablelistcountObj.value), routingtablelistcountObj.position);

        const item: { [s: string]: number | string } = {};
        item['id'] = idObj.value;
        item['status'] = statusObj.value;
        item['routingtableentries'] = routingtableentriesObj.value;
        item['startindex'] = startindexObj.value;
        item['routingtablelistcount'] = routingtablelistcountObj.value;
        item['routingtablelist'] = routingtablelistObj;

        return item;
    }

    public static readListRoutingTable(buffer: any, length: number, position: number): any {
        const value = [];
        const routingLstLength = length;


        let obj = { value: undefined, position: position } as any;
        for (let i = 0; i < routingLstLength; i++) {
            obj = XbeeHelper.buildItemRtg(buffer, obj.position);
            value.push(obj.value);
        }

        return value;
    }

    public static buildItemRtg(buffer: any, position: number): any {
        const statusLookup: { [n: number]: string } = {
            0: 'ACTIVE',
            1: 'DISCOVERY_UNDERWAY',
            2: 'DISCOVERY_FAILED',
            3: 'INACTIVE'
        };

        const destNwkAddrObj = XbeeHelper.readUInt16(buffer, position);
        const routeStatusObj = XbeeHelper.readUInt8(buffer, destNwkAddrObj.position);
        const nextHopNwkAddrObj = XbeeHelper.readUInt16(buffer, routeStatusObj.position);

        const item: { [s: string]: number | string } = {};
        item['destNwkAddr'] = destNwkAddrObj.value;
        item['routeStatus'] = statusLookup[routeStatusObj.value & 3];
        item['nextHopNwkAddr'] = nextHopNwkAddrObj.value;

        return { value: item, position: nextHopNwkAddrObj.position };
    }

    public static lqiTable(buffer): { [s: string]: number | string | [] } {
        const position = 0;
        const idObj = XbeeHelper.readUInt8(buffer, position);
        const statusObj = XbeeHelper.readUInt8(buffer, idObj.position);
        const neighbortableentriesObj = XbeeHelper.readUInt8(buffer, statusObj.position);
        const startindexObj = XbeeHelper.readUInt8(buffer, neighbortableentriesObj.position);
        const neighborlqilistcountObj = XbeeHelper.readUInt8(buffer, startindexObj.position);
        const neighborlqilistObj = XbeeHelper.readListNeighborLqi(buffer, Number(neighborlqilistcountObj.value), neighborlqilistcountObj.position);

        const item: { [s: string]: number | string } = {};

        item['id'] = idObj.value;
        item['status'] = statusObj.value;
        item['neighbortableentries'] = neighbortableentriesObj.value;
        item['startindex'] = startindexObj.value;
        item['neighborlqilistcount'] = neighborlqilistcountObj.value;
        item['neighborlqilist'] = neighborlqilistObj;

        return item;
    }

    public static frameIOConverter(buffer): any {
        const DIGITAL_CHANNELS = { MASK: {} as any, PIN: {} as any } as any;
        const ANALOG_CHANNELS = { MASK: {} as any, PIN: {} as any } as any;


        DIGITAL_CHANNELS.MASK[0] = ["DIO0", "AD0"];
        DIGITAL_CHANNELS.MASK[1] = ["DIO1", "AD1"];
        DIGITAL_CHANNELS.MASK[2] = ["DIO2", "AD2"];
        DIGITAL_CHANNELS.MASK[3] = ["DIO3", "AD3"];
        DIGITAL_CHANNELS.MASK[4] = ["DIO4"];
        DIGITAL_CHANNELS.MASK[5] = ["DIO5", "ASSOCIATE"];
        DIGITAL_CHANNELS.MASK[6] = ["DIO6", "RTS"];
        DIGITAL_CHANNELS.MASK[7] = ["DIO7", "CTS"];
        DIGITAL_CHANNELS.MASK[10] = ["DIO10", "RSSI"];
        DIGITAL_CHANNELS.MASK[11] = ["DIO11", "PWM"];
        DIGITAL_CHANNELS.MASK[12] = ["DIO12", "CD"];
        // Map pin/name to mask
        ANALOG_CHANNELS.PIN[20] = DIGITAL_CHANNELS.DIO0 = DIGITAL_CHANNELS.AD0 = 0;
        ANALOG_CHANNELS.PIN[19] = DIGITAL_CHANNELS.DIO1 = DIGITAL_CHANNELS.AD1 = 1;
        ANALOG_CHANNELS.PIN[18] = DIGITAL_CHANNELS.DIO2 = DIGITAL_CHANNELS.AD2 = 2;
        ANALOG_CHANNELS.PIN[17] = DIGITAL_CHANNELS.DIO3 = DIGITAL_CHANNELS.AD3 = 3;
        ANALOG_CHANNELS.PIN[11] = DIGITAL_CHANNELS.DIO4 = 4;
        ANALOG_CHANNELS.PIN[15] = DIGITAL_CHANNELS.DIO5 = DIGITAL_CHANNELS.ASSOCIATE = 5;
        ANALOG_CHANNELS.PIN[16] = DIGITAL_CHANNELS.DIO6 = DIGITAL_CHANNELS.RTS = 6;
        ANALOG_CHANNELS.PIN[12] = DIGITAL_CHANNELS.DIO7 = DIGITAL_CHANNELS.CTS = 7;
        ANALOG_CHANNELS.PIN[6] = DIGITAL_CHANNELS.DIO10 = DIGITAL_CHANNELS.RSSI = 10;
        ANALOG_CHANNELS.PIN[7] = DIGITAL_CHANNELS.DIO11 = DIGITAL_CHANNELS.PWM = 11;
        ANALOG_CHANNELS.PIN[4] = DIGITAL_CHANNELS.DIO12 = DIGITAL_CHANNELS.CD = 12;



        // Analog Channel Mask/Pins
        //
        // Map mask to name
        ANALOG_CHANNELS.MASK[0] = ["AD0", "DIO0"];
        ANALOG_CHANNELS.MASK[1] = ["AD1", "DIO1"];
        ANALOG_CHANNELS.MASK[2] = ["AD2", "DIO2"];
        ANALOG_CHANNELS.MASK[3] = ["AD3", "DIO3"];
        ANALOG_CHANNELS.MASK[7] = ["SUPPLY"];
        // map pin/name to mask
        ANALOG_CHANNELS.PIN[20] = ANALOG_CHANNELS.AD0 = ANALOG_CHANNELS.DIO0 = 0;
        ANALOG_CHANNELS.PIN[19] = ANALOG_CHANNELS.AD1 = ANALOG_CHANNELS.DIO1 = 1;
        ANALOG_CHANNELS.PIN[18] = ANALOG_CHANNELS.AD2 = ANALOG_CHANNELS.AD3 = 3;
        ANALOG_CHANNELS.PIN[17] = ANALOG_CHANNELS.SUPPLY = 7; // 17 True?


        const position = 0;
        const frame = {} as any;
        frame.digitalSamples = {};
        frame.analogSamples = {};
        frame.numSamples = 0;
        const numSamplesObj = XbeeHelper.readUInt8(buffer, position);
        frame.numSamples = numSamplesObj.value;

        const mskDObj = XbeeHelper.readUInt16be(buffer, numSamplesObj.position);
        const mskD = mskDObj.value;
        const mskAObj = XbeeHelper.readUInt8(buffer, mskDObj.position);
        const mskA = mskAObj.value;

        let lastObjPosition = mskAObj.position;
        if (mskD > 0) {
            const valDObj = XbeeHelper.readUInt16be(buffer, mskAObj.position);
            const valD = valDObj.value;
            lastObjPosition = valDObj.position;
            let dbit: any;
            for (dbit in DIGITAL_CHANNELS.MASK) {
                if ((mskD & (1 << dbit)) >> dbit) {
                    frame.digitalSamples[DIGITAL_CHANNELS.MASK[dbit][0]] = (valD & (1 << dbit)) >> dbit;
                }
            }
        }

        if (mskA > 0) {
            let abit: any;
            for (abit in ANALOG_CHANNELS.MASK) {
                if ((mskA & (1 << abit)) >> abit) {
                    const valA = XbeeHelper.readUInt16be(buffer, lastObjPosition);
                    frame.analogSamples[ANALOG_CHANNELS.MASK[abit][0]] = Math.round((valA.value * 1200) / 1023);
                }
            }
        }

        return frame;
    }

    public static readListNeighborLqi(buffer: any, length: number, position: number): any {
        const value = [];
        const lqiLstLength = length;
        let obj = { value: undefined, position: position } as any;
        for (let i = 0; i < lqiLstLength; i++) {
            obj = XbeeHelper.buildItemLqi(buffer, obj.position);
            value.push(obj.value);
        }
        return value;
    }

    public static buildItemLqi(buffer: any, position: number): any {
        const item: { [s: string]: number | string } = {};
        const extPandIdObj = XbeeHelper.readIeeeAddr(buffer, position);
        const extAddrObj = XbeeHelper.readIeeeAddr(buffer, extPandIdObj.position);
        const nwkAddrObj = XbeeHelper.readUInt16(buffer, extAddrObj.position);
        const value1Obj = XbeeHelper.readUInt8(buffer, nwkAddrObj.position);
        const deviceType = value1Obj.value & 0x03;
        const rxOnWhenIdle = (value1Obj.value & 0x0C) >> 2;
        const relationship = (value1Obj.value & 0x70) >> 4;
        const permitJoinObj = XbeeHelper.readUInt8(buffer, value1Obj.position);
        const depthObj = XbeeHelper.readUInt8(buffer, permitJoinObj.position);
        const lqiObj = XbeeHelper.readUInt8(buffer, depthObj.position);

        item['extPandId'] = extPandIdObj.value;
        item['extAddr'] = extAddrObj.value;
        item['nwkAddr'] = nwkAddrObj.value;
        item['deviceType'] = deviceType;
        item['rxOnWhenIdle'] = rxOnWhenIdle;
        item['relationship'] = relationship;
        item['permitJoin'] = permitJoinObj.value & 0x02;
        item['depth'] = depthObj.value;
        item['lqi'] = lqiObj.value;

        return { value: item, position: lqiObj.position };
    }


    public static readIeeeAddr(buffer, position: number): any {
        let pos = position;
        const length = 8;
        const value = buffer.slice(position, position + length);
        pos += length;
        return { value: XbeeHelper.addressBufferToString(value), position: pos };
    }

    public static readUInt16(buffer, position: number): any {
        let pos = position;
        pos += 2;
        return { value: buffer.readUInt16LE(position), position: pos };
    }

    public static readUInt16be(buffer, position: number): any {
        let pos = position;
        pos += 2;
        return { value: buffer.readUInt16BE(position), position: pos };
    }

    public static readUInt8(buffer, position: number): any {
        let pos = position;
        pos++;
        return { value: buffer.readUInt8(position), position: pos };
    }

    public static addressBufferToString(buffer: Buffer): string {
        let address = '';
        for (let i = 0; i < buffer.length; i++) {
            const value = buffer.readUInt8(buffer.length - i - 1);
            if (value <= 15) {
                address += '0' + value.toString(16);
            } else {
                address += value.toString(16);
            }
        }
        return address;
    }

    public static concatBuffer(buffer1, buffer2): ArrayBuffer {
        const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

        return tmp;
    }

    public static decimalToHexString(element: number): Array<number> {
        let toConvert = element;
        if (toConvert < 0) {
            toConvert = 0xFFFFFFFF + toConvert + 1;
        }

        return XbeeHelper.hexToBytes(toConvert.toString(16).toUpperCase());
    }

    public static readInt(array) {
        var value = 0;
        for (var i = 0; i < array.length; i++) {
            value = (value * 256) + array[i];
        }
        return value;
    }

    // Convert a hex string to a byte array
    public static hexToBytes(hex): Array<number> {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }

        return bytes;
    }

    public static toHexString(byteArray): string {
        return Array.from(byteArray, (byte: any) =>
            ('0' + (byte & 0xFF).toString(16)).slice(-2)
        ).join('');
    }



    public static byteArrayToNumber(byteArray): number {
        var value = parseInt(XbeeHelper.toHexString(byteArray), 16);
        return value;
    }

    public static numberToBytes(value: number): Array<number> {
        const hex = ('00000000000' + (value).toString(16)).substr(-4)

        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }

        return bytes;
    }

}
