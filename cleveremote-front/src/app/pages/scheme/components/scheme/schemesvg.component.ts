import { Component, ViewChild, ElementRef } from '@angular/core';
import { ProfitBarAnimationChartData } from '../../../../@core/data/profit-bar-animation-chart';
import { takeWhile, tap, mergeMap, delay } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { NbDialogService } from '@nebular/theme';
import { ModuleComponent } from '../module/module.component';
import { ModuleListComponent } from '../module/module-list/module.list.component';
import { CoreDataService } from '../../../../services/core.data.service';
import { DataService } from '../../../../services/websocket/websocket.service';

enum Status {
  SELECT = 'rgb(0, 150, 136)',
  WARNING = '#FFCD00',
  ERROR = '#FF0000',
  INPROCCESS = '#0000FF',
  DEFAULT = 'rgba(255, 255, 255, 0)'
}

@Component({
  selector: 'scheme-svg',
  styleUrls: ['./schemesvg.component.scss'],
  templateUrl: './schemesvg.component.html',
})
export class SchemeSvgComponent {
  private alive = true;
  public svg: any;
  public inputSector: string;



  linesData: { firstLine: number[]; secondLine: number[] };

  constructor(private http: HttpClient,
    private dialogService: NbDialogService,
    private profitBarAnimationChartService: ProfitBarAnimationChartData, private sanitizer: DomSanitizer,private dataService: DataService,
    private service: CoreDataService) {
    this.profitBarAnimationChartService.getChartData()
      .pipe(takeWhile(() => this.alive))
      .subscribe((linesData) => {
        this.linesData = linesData;
      });
  }


 



  ngOnInit() {
  //   this.dataService.observable.subscribe((x) => {
  //     console.log(x);
  // });
    const schemeId = '2a7e97a0-6e06-11ea-b0ac-0dbf788232cf';
    const svgdata = this.service.schemes[0].data;
   const svg = this.sanitizer.bypassSecurityTrustHtml(svgdata);
      this.svg = svg;
      of(true).pipe(delay(2000)).subscribe(() => {
        const sectors = ['sel_1', 'sel_2', 'sel_4', 'sel_5', 'sel_6'];
        this.initScheme(sectors);
      });
    

  }

  public setColor(newColor?: string) {
    var container = document.getElementById("scheme-container");
    const children = (container.children[0] as any).getElementById('sel_1');
    children.addEventListener("click", () => {
      const nextNode = children.firstChild.nextElementSibling;
      nextNode.style['fill'] = '#009688';
      nextNode.style['stroke'] = '#009688';
    });
  }

  public initScheme(sectors: Array<string>) {
    const svgContainer = document.getElementById('scheme-container');
    sectors.forEach(sector => {
      const children = (svgContainer.children[0] as any).getElementById(sector);
      const nextNode = children.firstChild.nextElementSibling;
      nextNode.style['fill'] = Status.DEFAULT;
      nextNode.style['stroke'] = Status.DEFAULT;
      children.addEventListener('click', () => {
        if (nextNode.style['fill'] === Status.DEFAULT) {
          nextNode.style['fill'] = Status.SELECT;
          nextNode.style['stroke'] = Status.SELECT;
          this.open3();
        } else {
          nextNode.style['fill'] = Status.DEFAULT;
          nextNode.style['stroke'] = Status.DEFAULT;
        }
      });
    });
  }

  public setElementStatus(sector: string, status: Status) {
    const svgContainer = document.getElementById('scheme-container');
    const children = (svgContainer.children[0] as any).getElementById(sector);
    const nextNode = children.firstChild.nextElementSibling;
    nextNode.style['fill'] = status;
    nextNode.style['stroke'] = status;
  }

  public setStatusWARNING() {
    this.setElementStatus(this.inputSector, Status.WARNING);
  }

  public setStatusError() {
    this.setElementStatus(this.inputSector, Status.ERROR);
  }

  public setStatusProccess() {
    this.setElementStatus(this.inputSector, Status.INPROCCESS);
  }

  open3() {
    this.dialogService.open(ModuleComponent);
    //.onClose.subscribe(name => name && this.names.push(name));
  }



}
