import { Component, OnDestroy, OnInit } from '@angular/core';

import { MENU_ITEMS } from './pages-menu';
import { NbMenuService, NbIconLibraries, NbIconConfig, NbMenuItem } from '@nebular/theme';
import { CoreDataService } from '../services/core.data.service';
import { from } from 'rxjs';
import { CanActivate, ActivatedRouteSnapshot, ActivatedRoute, Router } from '@angular/router';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout >
      <nb-menu (click)='testClick()' [items]="menu" tag="test"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements OnDestroy, OnInit {
  public devicesElement: NbMenuItem[];
  public menu = MENU_ITEMS;
  public subscriptions: Array<any> = [];

  constructor(private deviceService: NbMenuService,
    private iconLibraries: NbIconLibraries,
    private coreDataService: CoreDataService,
    private activetedRouter: ActivatedRoute,
    private router: Router) {
    this.iconLibraries.registerFontPack('font-awesome', { iconClassPrefix: 'fa', packClass: 'fa' });
    this.listenStatuschange();
  }


  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  public unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }

  public listenStatuschange() {
    const subscription = this.coreDataService.deviceCollection.onConnectivityChanges.subscribe((devices: any) => {
      devices.forEach(element => {
        const index = this.devicesElement.findIndex(_ => _.data.id === element.id);
        this.setStatus(index, element.status, this.devicesElement[index].data.status);
      });

    });
    this.subscriptions.push(subscription);
  }

  ngOnInit() {

    this.devicesElement = this.menu.filter((element: NbMenuItem) => element.title === 'Devices')[0].children;
    this.coreDataService.deviceCollection.elements.forEach(device => {
      this.devicesElement.push({ icon: { icon: 'square', pack: 'font-awesome' }, title: device.name, data: device });
    });

    this.coreDataService.currentDevice = this.coreDataService.deviceCollection.elements[0];


    this.deviceService.onItemClick().subscribe((element) => {
      const selected = this.devicesElement.find((device, index) => {
        if (element.item.title === device.title) {
          this.setSelected(index);
          return true;
        }
        return false;

      });
      if (selected) {
        element.item.icon = { icon: 'check-square', pack: 'font-awesome' };
        this.devicesElement.forEach(device => {
          if (device !== selected) {
            device.icon = { icon: 'square', pack: 'font-awesome' };
          }
        });
      }

    });
  }

  ngAfterViewInit() {
    this.removeClickOnDevicePage();
    this.setSelected(0);
  }

  public removeClickOnDevicePage() {
    document.querySelectorAll(".menu-items")[0].children[0].children[0].addEventListener("click", () => { }, false);
  }

  setSelected(index: number) {
    const elements = document.querySelectorAll(".menu-items")[1].children;
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      const deviceIcon = element.firstElementChild.firstElementChild;
      (deviceIcon as any).style.color = '#8f9bb3';
      (element.firstElementChild as any).style.color = '#8f9bb3';
    }


    const deviceElement = document.querySelectorAll(".menu-items")[1].children[index];

    const deviceIcon = deviceElement.firstElementChild.firstElementChild;
    (deviceIcon as any).style.color = '#3366ff'; //#192038
    (deviceElement.firstElementChild as any).style.color = '#3366ff'; //#192038
    const elementIcon = this.devicesElement[index];
    //deviceIcon.classList.add('fa-spin'); //for spinning
    elementIcon.icon = { icon: 'check-square', pack: 'font-awesome' }; //sync-alt
    this.devicesElement.forEach(device => {
      if (device.title !== elementIcon.title) { //replace by id
        device.icon = { icon: 'square', pack: 'font-awesome' };
      }
    });
    this.coreDataService.currentDevice = this.coreDataService.deviceCollection.elements.find((res) => res.id === this.devicesElement[index].data.id);



    // const currentUrl = this.router.url;
    // this.activetedRouter.snapshot;

    // const currentConfigRoute = this.activetedRouter.snapshot.routeConfig.children.find((child) => child.path === 'Scheme');

    // from(this.router.navigateByUrl('/pages/' + currentConfigRoute.path))
    //   .subscribe();
    // //  .pipe(mergeMap(() => {
    // //   return from(this.router.navigate(['Scheme']));
    // // }))
    // // from(this.router.navigateByUrl('/pages/Scheme')).subscribe();
    // //location.reload()
  }

  setStatus(index: number, status: string, previousStatus: string) {
    const elements = document.querySelectorAll(".menu-items")[1].children;
    const deviceElement = document.querySelectorAll(".menu-items")[1].children[index];

    const innerHtmllocation = deviceElement.firstElementChild.children[1];
    const inactiveInner = `<nb-icon class="menu-icon fa fa-power-off" style="color: rgb(143, 155, 179); font-size:18px; float:right;"></nb-icon>`;
    //const activeInner = `<nb-icon class="menu-icon fa-spin fa fa-cog" style="color: rgb(51, 102, 255); font-size:18px; margin-left: 1.5rem;"></nb-icon>`;
    const activeInner = `<nb-icon class="menu-icon fa fa-power-off" style="color: #00a223; font-size:18px; float:right;"></nb-icon>`;

    innerHtmllocation.innerHTML = innerHtmllocation.innerHTML.replace(inactiveInner, '');
    innerHtmllocation.innerHTML = innerHtmllocation.innerHTML.replace(activeInner, '');
    if (status === 'INACTIF') {
      innerHtmllocation.innerHTML = innerHtmllocation.innerHTML + inactiveInner;
    } else {
      innerHtmllocation.innerHTML = innerHtmllocation.innerHTML + activeInner;
    }
  }

  public testClick(param: any) {
  }
}
