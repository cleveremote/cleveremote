import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Resolve } from '@angular/router';
import { of } from 'rxjs';
import { RessourcesService } from './ressources.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { mergeMap } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from './websocket/websocket.service';

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
    public modules: Array<any> = [];
    public devices: Array<any> = [];
    public schemes: Array<any> = [];
    constructor(private sanitizer: DomSanitizer,
        private ressourceService: RessourcesService,
        private dataService: DataService) {
            this.sub = this.dataService.observable.subscribe((x) => {
                console.log(x);
            });
    }

   


    ngOnDestroy() {
 this.sub.unsubscribe();
    }

    public resolve(): Observable<any> {
        return this.ressourceService.getAccountDevices('server_1')
            .pipe(mergeMap((devices: any) => {
                return this.ressourceService.getAccountModules('server_1')
                    .pipe(mergeMap((modules: Array<any>) => {
                        this.buildDevicesData(devices, modules);
                        setInterval(() => {
                            this.modules[0].value = Math.floor(Math.random() * 30).toString();
                        }, 3000);
                        return of(modules);
                    }));
            })).pipe(mergeMap((result: any) => {
                const svgStored = localStorage.getItem('2a7e97a0-6e06-11ea-b0ac-0dbf788232cf');
                if (svgStored) {
                    this.schemes.push({ data: svgStored });
                   
                    return of(true);
                }
                return this.ressourceService.getScheme('2a7e97a0-6e06-11ea-b0ac-0dbf788232cf').pipe(mergeMap((result) => {
                    const svg = this.sanitizer.bypassSecurityTrustHtml(result.data);
                    localStorage.setItem('2a7e97a0-6e06-11ea-b0ac-0dbf788232cf', result.data);
                    this.schemes.push(result);
                   
                    return of(true);
                }));
            }));

    }

    public buildDevicesData(devices: Array<any>, modules: Array<any>): void {
        devices.forEach(device => {
            if (device.groupViews && device.groupViews.length > 0) {
                device.groupViews.forEach(groupView => {
                    groupView.modules = [];
                    if (groupView.assGroupViewModules && groupView.assGroupViewModules.length > 0) {
                        groupView.assGroupViewModules.forEach(ass => {
                            const moduleRef = modules.find((m) => m.moduleId === ass.moduleId);
                            groupView.modules.push(moduleRef);
                        });
                    }
                });
            }
            if (device.transceivers && device.transceivers.length > 0) {
                device.transceivers.forEach(transceiver => {
                    if (transceiver.modules && transceiver.modules.length) {
                        transceiver.modules.forEach((module, index) => {
                            transceiver.modules[index] = modules.find((m) => m.moduleId === module.moduleId);
                        });
                    }
                });
            }

        });

        this.devices = devices;
        this.modules = modules;
    }

    public buildModulesData(modules: Array<any>) {

    }


}
