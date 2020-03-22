import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { ProfitBarAnimationChartData } from '../../../../../@core/data/profit-bar-animation-chart';
import { takeWhile, tap, mergeMap, delay } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { NbThemeService } from '@nebular/theme';
import { SolarData } from '../../../../../@core/data/solar';
import { IModuleElement, ModuleType, SourceType } from '../interfaces/module.interfaces';

enum Status {
  SELECT = 'rgb(0, 150, 136)',
  WARNING = '#FFCD00',
  ERROR = '#FF0000',
  INPROCCESS = '#0000FF',
  DEFAULT = 'rgba(255, 255, 255, 0)'
}

interface CardSettings {
  title: string;
  iconClass: string;
  type: string;
}

@Component({
  selector: 'module-list-all',
  styleUrls: ['./module.list.all.component.scss'],
  templateUrl: './module.list.all.component.html',
})
export class ModuleListAllComponent {
  @Input() modules: Array<any> = [];
  @Input() groupChanges: Array<any> = [];
  public sourceType = SourceType;

  public modifyGroup(event: any) {
    const ele = this.groupChanges.find((x) => x.moduleId === event.module.moduleId);
    if(ele){
      ele.checked = event.checked;
    } else {
      event.module.checked = true;
      this.groupChanges.push(event.module);
    }
  }

}
