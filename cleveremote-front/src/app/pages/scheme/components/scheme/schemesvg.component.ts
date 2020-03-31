import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProfitBarAnimationChartData } from '../../../../@core/data/profit-bar-animation-chart';
import { takeWhile, delay, mergeMap, tap } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of } from 'rxjs';
import { NbDialogService } from '@nebular/theme';
import { ModuleComponent } from '../module/module.component';
import { CoreDataService } from '../../../../services/core.data.service';
import { SectorElement } from '../../../../services/collections/elements/sector.element';
import { SchemeElement } from '../../../../services/collections/elements/scheme.element';
import { RessourcesService } from '../../../../services/ressources.service';
import { SELECT_STATUS, WORKING_STATUS } from '../../../../services/collections/elements/interfaces/scheme.interfaces';



@Component({
  selector: 'scheme-svg',
  styleUrls: ['./schemesvg.component.scss'],
  templateUrl: './schemesvg.component.html',
})
export class SchemeSvgComponent implements OnInit {
  @Input() schemeElement: SchemeElement;
  public sectorName: string;
  public selectedName: string;

  public svg: SafeHtml;
  public sectors: Array<SectorElement>;
  public svgContainer: any;
  public schemeContainer: any;

  public listSectorProcess: Array<any> = [];
  public listSelectStatus: Array<any> = [];

  constructor(
    private dialogService: NbDialogService,
    private sanitizer: DomSanitizer,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService
  ) { }

  ngOnInit() {
    const svgdata = this.schemeElement.svg;
    const svg = this.sanitizer.bypassSecurityTrustHtml(svgdata);
    this.svg = svg;


    of(true).pipe(delay(500)).subscribe(() => {
      this.sectors = this.coreDataService.sectorCollection.elements.filter((sector) => sector.schemeId === this.schemeElement.id);
      this.svgContainer = document.getElementById('scheme-container');
      this.schemeContainer = (this.svgContainer.children[0] as any);
      this.initScheme(this.sectors);
      this.checkStartProccess(this.sectors);
    });
  }

  public listenStatuschange() {
    this.coreDataService.sectorCollection.onSectorStatusChange.subscribe((sector: any) => {
      this.checkStartProccess([sector]);
    });
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

  public setStatusSelect(sector: SectorElement, status: SELECT_STATUS) {
    const elementStatus = this.listSelectStatus.find((selectStatus) => selectStatus.sector.id === sector.id);
    const children = this.schemeContainer.getElementById(sector.id);
    const target = children.firstChild.nextElementSibling;
    target.style['fill'] = status;
    target.style['stroke'] = status;
    elementStatus.status = status;
  }

  public setName(sector: SectorElement, value: string = sector.name) {
    const childrenName = this.schemeContainer.getElementById("selname_" + sector.id);
    childrenName.textContent = value;
  }

  public getStatusSelect(sector: SectorElement) {
    return this.listSelectStatus.find((selectStatus) => selectStatus.sector.id === sector.id).status;
  }

  public initScheme(sectorElements: Array<SectorElement>) {

    this.sectors.forEach(sector => {
      this.listSectorProcess.push({ sector: sector, interval: undefined });
      this.listSelectStatus.push({ sector: sector, status: SELECT_STATUS.DEFAULT });
      this.setStatusSelect(sector, SELECT_STATUS.DEFAULT);
      this.setName(sector, '');
      const children = this.schemeContainer.getElementById(sector.id);

      children.addEventListener('click', (event) => {
        this.unSelectAll(sectorElements);
        const sectorData = this.getSectorData(event);
        this.setName(sectorData);
        const status = this.getStatusSelect(sector);
        if (status !== SELECT_STATUS.SELECT) {
          this.setStatusSelect(sectorData, SELECT_STATUS.SELECT);
          this.openSector(event);
        } else {
          this.setStatusSelect(sectorData, SELECT_STATUS.DEFAULT);
        }
      });

      children.addEventListener('mouseover', (event) => {
        const sectorData = this.getSectorData(event);
        this.setName(sectorData);
        const status = this.getStatusSelect(sectorData);
        if (status !== SELECT_STATUS.OVER) {
          this.setStatusSelect(sectorData, SELECT_STATUS.OVER);
        }
      });

      children.addEventListener('mouseout', (event) => {
        const sectorData = this.getSectorData(event);
        this.setName(sectorData, '');
        const status = this.getStatusSelect(sectorData);
        if (status === SELECT_STATUS.OVER) {
          this.sectorName = undefined;
          this.setStatusSelect(sectorData, SELECT_STATUS.DEFAULT);
        }
      });
    });
    this.listenStatuschange();
  }

  public unSelectAll(sectorElements: Array<SectorElement>) {
    sectorElements.forEach(sectorElement => {
      this.setStatusSelect(sectorElement, SELECT_STATUS.DEFAULT);
    });
  }


  openSector(event: any) {
    const sectorId = event.currentTarget.id;
    this.resourceService.getSector(sectorId)
      .pipe(tap((sector) => {
        const sectorElement = this.coreDataService.sectorCollection.reload([sector])[0];
        this.dialogService.open(ModuleComponent, {
          context: {
            sectorElement: sectorElement
          },
        }).onClose.subscribe(name => this.unSelectAll(this.sectors));
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
      this.setStatusSelect(data.sector, SELECT_STATUS.DEFAULT);
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
    this.setStatusSelect(sector.sector, SELECT_STATUS.DEFAULT);
  }

}
