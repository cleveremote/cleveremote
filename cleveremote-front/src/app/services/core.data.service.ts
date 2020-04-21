import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Resolve } from '@angular/router';
import { of } from 'rxjs';
import { RessourcesService } from './ressources.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { mergeMap } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from './websocket/websocket.service';
import { IWSMessage, ACTION_TYPE, LEVEL_TYPE } from './websocket/interfaces/ws.message.interfaces';
import { ElementFactory } from './collections/elements/element.factory';
import { ModuleCollection } from './collections/module.collection';
import { ModuleElement } from './collections/elements/module.element';
import { GroupViewCollection } from './collections/groupview.collection';
import { TransceiverCollection } from './collections/transceiver.collection';
import { DeviceCollection } from './collections/device.collection';
import { SectorCollection } from './collections/sector.collection';
import { SchemeCollection } from './collections/scheme.collection';
import { DeviceElement } from './collections/elements/device.element';
import { GroupViewElement } from './collections/elements/groupview.element';
import { BaseCollection } from './collections/base.collection';
import { UserCollection } from './collections/user.collection';
import { AccountCollection } from './collections/account.collection';
import { ValueCollection } from './collections/value.collection';
import { NetworkCollection } from './collections/network.collection';

export class Message {
    constructor(
        public sender: string,
        public content: string,
        public isBroadcast = false,
    ) { }
}



@Injectable()
export class CoreDataService implements OnDestroy, Resolve<any> {
    public sub: Subscription;

    public subscriptions = [];
    public onDataChanges = new Subject<any>();
    public onDeviceChange = new Subject<any>();

    public collectionStore: Array<BaseCollection<any>> = [];

    private _currentDevice: DeviceElement;
    private _currtentAccount: any;

    constructor(private sanitizer: DomSanitizer,
        private ressourceService: RessourcesService,
        private dataService: DataService,
        public moduleCollection: ModuleCollection,
        public groupViewCollection: GroupViewCollection,
        public transceiverCollection: TransceiverCollection,
        public deviceCollection: DeviceCollection,
        public sectorCollection: SectorCollection,
        public schemeCollection: SchemeCollection,
        public userCollection: UserCollection,
        public accountCollection: AccountCollection,
        public valueCollection: ValueCollection,
        public networkCollection: NetworkCollection
    ) {
        this.collectionStore.push(this.moduleCollection);
        this.collectionStore.push(this.groupViewCollection);
        this.collectionStore.push(this.transceiverCollection);
        this.collectionStore.push(this.deviceCollection);
        this.collectionStore.push(this.schemeCollection);
        this.collectionStore.push(this.sectorCollection);
        this.collectionStore.push(this.userCollection);
        this.collectionStore.push(this.accountCollection);
        this.collectionStore.push(this.valueCollection);
        this.collectionStore.push(this.networkCollection);

        this.subscriptions.push(this.dataService.observable.subscribe((message: any) => this.proccessWSMessage(message)));
    }

    get currentDevice(): DeviceElement {
        return this._currentDevice;
    }

    set currentDevice(deviceElement: DeviceElement) {
        this._currentDevice = deviceElement;
        this.onDeviceChange.next(deviceElement);
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    public resolve(): Observable<any> {
        return this.ressourceService.getFrontAccountData()
            .pipe(mergeMap((account: any) => {
                return of(this.accountCollection.reload([account]));
            }))
            .pipe(mergeMap((result) => {
                // get transceivers = with subscribe.
                const moduleids = this.moduleCollection.elements.map(module => module.id);
                return this.ressourceService.getAllLastModuleValues(moduleids)
                    .pipe(mergeMap((lastLogData: Array<any>) => {
                        this.moduleCollection.updateValues(lastLogData);
                        this.valueCollection.reload();
                        return of(true);
                    }));
            }));
    }


    public initFrontData(account: any): any {
        if (account && account.devices && account.devices.length > 0) {
            this.deviceCollection.reload(account.devices);
        }
    }


    public deepFindAndSync(wsMessage) {
        const entityType = wsMessage.target;
        const sourceData = wsMessage.data;
        const actionType = wsMessage.typeAction;

        const parentsToSync = this.getParents(sourceData[0]);
        parentsToSync.forEach(parentToSync => {
            const collectionInstance = this.getCollectionInstanceByType(parentToSync.name);
            collectionInstance.reload(sourceData, entityType, actionType);
        });
    }

    getParents(element) {
        const founds: Array<any> = [];
        for (const prop in element) {
            if (element.hasOwnProperty(prop)) {
                if (prop.slice(-2) === 'Id') {
                    const name = prop.slice(0, -2);
                    const nameCapitalized = name.charAt(0).toUpperCase() + name.slice(1);
                    founds.push({ name: nameCapitalized, value: element[prop] });
                }
            }
        }
        return founds;
    }

    getCollectionInstanceByType(type: string) {
        const collectionName = type + 'Collection';
        return this.collectionStore.find((c: any) => c.constructor.name === collectionName);
    }

    public proccessWSMessage(message) {
        try {
            const wsMessage = JSON.parse(message.content);
            this.deepFindAndSync(wsMessage);
        } catch (e) { }
    }

}