import { IUpdatable } from './interfaces/collection.interfaces';
import { Subject } from 'rxjs';
import { GroupViewElement } from './elements/groupview.element';
import { TransceiverElement } from './elements/transceiver.element';
import { DeviceElement } from './elements/device.element';
import { SchemeElement } from './elements/scheme.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { SectorCollection } from './sector.collection';
import { DomSanitizer } from '@angular/platform-browser';
import { LEVEL_TYPE, ACTION_TYPE } from '../websocket/interfaces/ws.message.interfaces';
import { NetworkElement } from './elements/network.element';
import { TransceiverCollection } from './transceiver.collection';
import { TRANSCIEVER_TYPE } from './elements/interfaces/transceiver.interfaces';
import { DeviceCollection } from './device.collection';

@Injectable()
export class NetworkCollection extends BaseCollection<NetworkElement> {
    public onNetworkChanges = new Subject<NetworkElement>();
    public elements: Array<NetworkElement> = [];

    public type = 'Network';

    constructor(private transceiverCollection: TransceiverCollection, private deviceCollection: DeviceCollection) {
        super();
    }

    public reload(entities: any, levelType: LEVEL_TYPE = LEVEL_TYPE.ROOT, action: ACTION_TYPE = ACTION_TYPE.LOAD) {

        entities.forEach(networkEntity => {
            if (this.elements && this.elements.length > 0) {
                networkEntity = this.buildGraphData(networkEntity);
                this.elements[0] = networkEntity;
            } else {
                networkEntity = this.buildGraphData(networkEntity);
                this.elements.push(networkEntity);
            }
            this.onNetworkChanges.next(networkEntity);
        });

        const ids = entities.map(entity => entity.id);
        return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);
    }

    public buildGraphData(entity): any {
        const nodesToAdd = [];
        const linksToAdd = [];
        let boxId = '';
        entity.nodes.forEach(node => {
            const transceiver = this.transceiverCollection.elements.find(_ => _.id === node.id);
            boxId = transceiver.deviceId;
            if (transceiver) {
                node.name = transceiver.name;
                node.type = TRANSCIEVER_TYPE[transceiver.type];
                transceiver.modules.forEach(module => {
                    nodesToAdd.push({ id: module.id, name: module.name, type: 'MODULE', status: 'WIRED' });
                    linksToAdd.push({ source: transceiver.id, target: module.id, status: 'WIRED', type: 'WIRE' });
                });
            }
        });
        nodesToAdd.forEach(node => {
            entity.nodes.push(node);
        });
        linksToAdd.forEach(link => {
            entity.links.push(link);
        });
        const device = this.deviceCollection.elements.find(_ => _.id === boxId);
        const coordinator = this.transceiverCollection.elements.find(_ => _.type === TRANSCIEVER_TYPE.COORDINATOR && _.deviceId === device.id);
        entity.nodes.push({ id: device.id, name: '', type: 'BOX', status: 'WIRED' });
        entity.links.push({ source: 'server_1', target: coordinator.id, status: 'WIRED', type: 'WIRE' });
        entity.links.push({ source: coordinator.id, target: 'server_1', status: 'WIRED', type: 'WIRE' });
        return entity;
    }
}
