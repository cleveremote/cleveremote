import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ProfitBarAnimationChartData } from '../../../../@core/data/profit-bar-animation-chart';
import { takeWhile, delay, mergeMap, tap, filter, takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of, Subject, Subscription } from 'rxjs';
import { NbDialogService } from '@nebular/theme';
import { ModuleComponent } from '../module/module.component';
import { CoreDataService } from '../../../../services/core.data.service';
import { SectorElement } from '../../../../services/collections/elements/sector.element';
import { SchemeElement } from '../../../../services/collections/elements/scheme.element';
import { RessourcesService } from '../../../../services/ressources.service';
import { SELECT_STATUS, WORKING_STATUS } from '../../../../services/collections/elements/interfaces/scheme.interfaces';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { DeviceElement } from '../../../../services/collections/elements/device.element';
import { SectorFormComponent } from '../forms/sector-form.component';



@Component({
  selector: 'scheme-svg',
  styleUrls: ['./schemesvg.component.scss'],
  templateUrl: './schemesvg.component.html',
})
export class SchemeSvgComponent implements OnInit, OnDestroy {
  @Input() schemeElement: SchemeElement;
  public sectorName: string;
  public selectedName: string;

  public svg: SafeHtml;
  public sectors: Array<SectorElement>;
  public svgContainer: any;
  public schemeContainer: any;

  public listSectorProcess: Array<any> = [];
  public listSelectStatus: Array<any> = [];
  public destroyed = new Subject<any>();
  private subscriptions: Array<Subscription> = [];
  public navbarStatus: any = { previous: false, next: false, modules: false, settings: false };
  constructor(
    private dialogService: NbDialogService,
    private sanitizer: DomSanitizer,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService,
    private router: Router
  ) {
  }


  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  public unsubscribeAll() {
    this.stopAllIprocess();
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }

  ngOnInit() {
    this.loadComponentData();
  }

  loadComponentData(schemeElement?: SchemeElement) {

    this.stopAllIprocess();
    this.listSectorProcess = [];
    this.listSelectStatus = [];
    this.svg = schemeElement ? schemeElement.svg : this.coreDataService.currentDevice.schemes[0].svg;
    of(true).pipe(delay(500)).subscribe(() => {
      this.sectors = this.coreDataService.sectorCollection.elements.filter((sector) => sector.schemeId === (schemeElement ? schemeElement.id : this.coreDataService.currentDevice.schemes[0].id));
      this.svgContainer = document.getElementById('scheme-container');
      this.schemeContainer = (this.svgContainer.children[0] as any);
      this.unsubscribeAll();
      this.initScheme(this.sectors);
      this.checkSchemeNavbarStatus();
      this.checkStartProccess(this.sectors);
      this.listenOnDeviceChange();
    });
  }

  public listenOnDeviceChange() {
    const subscription = this.coreDataService.onDeviceChange.subscribe((device: DeviceElement) => {
      this.loadComponentData();
    });
    this.subscriptions.push(subscription);
  }

  public listenStatuschange() {
    const subscription = this.coreDataService.sectorCollection.onSectorStatusChange.subscribe((sector: any) => {
      this.checkStartProccess([sector]);
    });
    this.subscriptions.push(subscription);
  }

  public checkStartProccess(sectors: Array<SectorElement>) {
    sectors.forEach(sector => {
      const sectorProcess = this.listSectorProcess.find((process) => process.sector.id === sector.id);
      if (sectorProcess) {
        if (sector.status === WORKING_STATUS.INPROCCESS) {
          this.setInProcess(sectorProcess);
        } else {
          this.setStopInProcess(sectorProcess);
        }
      }
    });

  }
  public stopAllIprocess() {
    this.listSectorProcess.forEach(sectorProcess => {
      this.setStopInProcess(sectorProcess);
    });
  }

  public setStatusSelect(sector: SectorElement, status: SELECT_STATUS) {
    const elementStatus = this.listSelectStatus.find((selectStatus) => selectStatus.sector.id === sector.id);
    const children = this.schemeContainer.getElementById(sector.id);
    const target = children.firstChild.nextElementSibling;
    target.style['fill'] = status;
    target.style['stroke'] = status;
    elementStatus.previousStatus = elementStatus.status;
    elementStatus.status = status;
  }

  public setName(sector: SectorElement, value: string = sector.name) {
    const childrenName = this.schemeContainer.getElementById("selname_" + sector.id);
    childrenName.textContent = value;
  }

  public getCurrentStatus(sector: SectorElement) {
    return this.listSelectStatus.find((selectStatus) => selectStatus.sector.id === sector.id).status;
  }
  public getPreviousStatus(sector: SectorElement) {
    return this.listSelectStatus.find((selectStatus) => selectStatus.sector.id === sector.id).previousStatus;
  }

  public checkSchemeNavbarStatus() {
    this.navbarStatus = { previous: false, next: false, modules: false, settings: false };
    const selectedElement = this.listSelectStatus.find((selectStatus) => selectStatus.status === SELECT_STATUS.SELECT);
    if (selectedElement) {
      const selectedSector: SectorElement = selectedElement.sector;
      this.navbarStatus = { previous: false, next: false, modules: true, settings: true };
      if (selectedSector.schemeDetailId) {
        this.navbarStatus.next = true;
      } else {
        this.navbarStatus.next = false;
      }
      const previousParentSector = this.coreDataService.sectorCollection.elements.find((sector) => sector.schemeDetailId === this.sectors[0].schemeId);
      if (previousParentSector) {
        this.navbarStatus.previous = true;
      } else {
        this.navbarStatus.previous = false;
      }
    } else {
      this.navbarStatus.modules = false;
      this.navbarStatus.settings = false;
      const previousParentSector = this.coreDataService.sectorCollection.elements.find((sector) => sector.schemeDetailId === this.sectors[0].schemeId);
      if (previousParentSector) {
        this.navbarStatus.previous = true;
      } else {
        this.navbarStatus.previous = false;
      }
    }

  }

  public initScheme(sectorElements: Array<SectorElement>) {
    this.sectors.forEach(sector => {
      this.listSectorProcess.push({ sector: sector, interval: undefined });
      this.listSelectStatus.push({ sector: sector, previousStatus: SELECT_STATUS.DEFAULT, status: SELECT_STATUS.DEFAULT });
      this.setStatusSelect(sector, SELECT_STATUS.DEFAULT);
      this.setName(sector, '');
      const children = this.schemeContainer.getElementById(sector.id);

      children.addEventListener('click', (event) => {

        const sectorData = this.getSectorData(event);
        const status = this.getCurrentStatus(sector);
        if (status !== SELECT_STATUS.SELECT) {
          this.setName(sectorData);
          this.setStatusSelect(sectorData, SELECT_STATUS.SELECT);
          this.unSelectAll(sectorElements);
          this.setStatusSelect(sectorData, SELECT_STATUS.SELECT);
          this.checkSchemeNavbarStatus();
          if (!this.navbarStatus.next) {
            this.openSector(event.currentTarget.id);
          }
        } else {
          this.setName(sectorData, '');
          this.sectorName = undefined;
          this.setStatusSelect(sectorData, SELECT_STATUS.DEFAULT);
          this.checkSchemeNavbarStatus();
        }
      });

      children.addEventListener('mouseover', (event) => {
        const sectorData = this.getSectorData(event);
        const status = this.getCurrentStatus(sectorData);
        if (status === SELECT_STATUS.DEFAULT) {
          this.setName(sectorData);
          this.setStatusSelect(sectorData, SELECT_STATUS.OVER);
        }
      });

      children.addEventListener('mouseout', (event) => {
        const sectorData = this.getSectorData(event);
        const status = this.getCurrentStatus(sectorData);
        if (status === SELECT_STATUS.OVER) {
          this.setName(sectorData, '');
          this.sectorName = undefined;
          this.setStatusSelect(sectorData, SELECT_STATUS.DEFAULT);
        }
      });
    });
    this.checkSchemeNavbarStatus();
    this.listenStatuschange();
  }

  public unSelectAll(sectorElements: Array<SectorElement>) {
    sectorElements.forEach(sectorElement => {
      this.setStatusSelect(sectorElement, SELECT_STATUS.DEFAULT);
    });
  }


  openSector(sectorId: string) {
    this.resourceService.getSector(sectorId)
      .pipe(tap((sector) => {
        const sectorElement = this.coreDataService.sectorCollection.reload([sector])[0];
        this.dialogService.open(ModuleComponent, {
          context: {
            sectorElement: sectorElement
          },
        }).onClose.subscribe(name => {
          this.coreDataService.sectorCollection.checkStatus(sectorId);
        });
      })).subscribe();
  }

  openSectorProperties(sectorId: string) {
    this.resourceService.getSector(sectorId)
      .pipe(tap((sector) => {
        const sectorElement = this.coreDataService.sectorCollection.reload([sector])[0];
        this.dialogService.open(SectorFormComponent, {
          context: {
            sectorElement: sectorElement
          },
        }).onClose.subscribe(name => {
        });
      })).subscribe();
  }

  public getSectorData(event: any) {
    const sectorId = event.currentTarget.id;
    return this.coreDataService.sectorCollection.elements.find((sector) => sector.id === sectorId);
  }

  public checkSectorsInProccess(sectorIntervalData) {
    const sector = sectorIntervalData.sector;
    const sectorInterval = sectorIntervalData.interval;

    const module = sector.groupView[0].modules.find((m) => m.value === 'ON');
    if (module && !sectorInterval) {
      this.setInProcess(sectorIntervalData);
    } else if (!module && sectorInterval) {
      this.setStopInProcess(sectorIntervalData);
    }
  }

  public setInProcess(data) {
    if (data.interval) {
      clearInterval(data.interval);
      data.interval = null;
      // const currentStatus = this.getCurrentStatus(data.sector.id);
      // this.setStatusSelect(data.sector, currentStatus);
    }
    data.interval = setInterval(() => {
      const children = this.schemeContainer.getElementById(data.sector.id);
      const nextNode = children.firstChild.nextElementSibling;
      setTimeout(() => {
        if (nextNode.style['fill'] === SELECT_STATUS.INPROCCESS_BLINK) {
          nextNode.style['fill'] = SELECT_STATUS.INPROCCESS;
          nextNode.style['stroke'] = SELECT_STATUS.INPROCCESS;
        } else {
          nextNode.style['fill'] = SELECT_STATUS.INPROCCESS_BLINK;
          nextNode.style['stroke'] = SELECT_STATUS.INPROCCESS_BLINK;
        }
      }, 500);
    }, 1000);
  }

  public setStopInProcess(sector) {
    clearInterval(sector.interval);
    sector.interval = null;
    setTimeout(() => {
      const currentStatus = this.getCurrentStatus(sector.sector);
      this.setStatusSelect(sector.sector, currentStatus);
    }, 500);
  }

  openDetail() {
    const selectedSector: SectorElement = this.listSelectStatus.find((selectStatus) => selectStatus.status === SELECT_STATUS.SELECT).sector;
    this.openSector(selectedSector.id);
  }
  openSettings() {
    const selectedSector: SectorElement = this.listSelectStatus.find((selectStatus) => selectStatus.status === SELECT_STATUS.SELECT).sector;
    this.openSectorProperties(selectedSector.id);
  }

  public gotoPreviousScheme() {
    const previousParentSector = this.coreDataService.sectorCollection.elements.find((sector) => sector.schemeDetailId === this.sectors[0].schemeId);
    this.loadComponentData(this.coreDataService.schemeCollection.elements.find((scheme) => scheme.id === previousParentSector.schemeId));
  }

  public gotoNextScheme() {
    const selectedSector: SectorElement = this.listSelectStatus.find((selectStatus) => selectStatus.status === SELECT_STATUS.SELECT).sector;
    this.loadComponentData(selectedSector.schemeDetail[0]);
  }

}
