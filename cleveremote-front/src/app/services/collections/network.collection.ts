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

@Injectable()
export class NetworkCollection extends BaseCollection<NetworkElement> {
    public onNetworkChanges = new Subject<NetworkElement>();
    public elements: Array<NetworkElement> = [];

    public type = 'Network';

    constructor(private sectorCollection: SectorCollection,
        private sanitizer: DomSanitizer) {
        super();
    }

    public reload(entities: any, levelType: LEVEL_TYPE = LEVEL_TYPE.ROOT, action: ACTION_TYPE = ACTION_TYPE.LOAD) {
        
            entities.forEach(networkEntity => {
                if (this.elements && this.elements.length > 0) {
                    this.elements[0] = networkEntity;
                } else {
                    this.elements.push(networkEntity);
                }
                this.onNetworkChanges.next(networkEntity);
                // schemeEntity.svg = this.sanitizer.bypassSecurityTrustHtml(schemeEntity.svg.data);

                // if (schemeEntity.sectors && schemeEntity.sectors.length > 0) {
                //     schemeEntity.sectors = this.sectorCollection.reload(schemeEntity.sectors);
                //     schemeEntity.sectors.forEach(sector => {
                //         if (sector.schemeDetail) {
                //             sector.schemeDetail = this.reload([sector.schemeDetail]);
                //         }
                //     });
                // }

                // const elementIndex = this.elements.findIndex((g) => g.id === schemeEntity.id);
                // if (elementIndex === -1) {
                //     this.elements.push(schemeEntity);
                // } else {
                //     this.elements[elementIndex] = schemeEntity;
                // }
                // if (schemeEntity.scheme) {
                //     this.reload([schemeEntity.scheme]);
                // }
            });

            const ids = entities.map(entity => entity.id);
            return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);

//        this.loadBylevel(entities, levelType, action);
    }

    // private loadBylevel(entities: any, levelType: LEVEL_TYPE, action: ACTION_TYPE) {
    //     let classNameId = this.constructor.name.replace('Collection', '') + 'Id';
    //     classNameId = classNameId.charAt(0).toLowerCase() + classNameId.slice(1);
    //     const target = this.elements.find((element) => element.id === entities[0][classNameId]);
    //     if (!target) return [];
    //     switch (levelType) {
    //         case LEVEL_TYPE.SECTOR:
    //             target.sectors = this.execSync(target.sectors, this.sectorCollection, entities, action);
    //             break;
    //     }
    //     return target;
    // }
}
