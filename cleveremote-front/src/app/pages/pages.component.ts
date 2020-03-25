import { Component } from '@angular/core';

import { MENU_ITEMS } from './pages-menu';
import { NbMenuService, NbIconLibraries, NbIconConfig, NbMenuItem } from '@nebular/theme';
import { CoreDataService } from '../services/core.data.service';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu (click)='testClick()' [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent {
  public devicesElement: NbMenuItem[];
  constructor(private deviceService: NbMenuService,
    private iconLibraries: NbIconLibraries,
    private coreDataService: CoreDataService) {
    this.iconLibraries.registerFontPack('font-awesome', { iconClassPrefix: 'fa', packClass: 'fa' });
  }
  menu = MENU_ITEMS;

  ngOnInit() {
    const modules = this.coreDataService.modules;
    this.devicesElement = this.menu.filter((element: NbMenuItem) => element.title === 'Devices')[0].children;
    // this.setSelected();
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

  ngAfterViewInit(){
    this.setSelected(0);
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
      elementIcon.icon = { icon: 'check-square', pack: 'font-awesome' };
      this.devicesElement.forEach(device => {
        if (device.title !== elementIcon.title) { //replace by id
          device.icon = { icon: 'square', pack: 'font-awesome' };
        }
      });
  }

  public testClick(param: any) {
  }
}
