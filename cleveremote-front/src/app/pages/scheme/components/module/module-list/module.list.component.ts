import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { ProfitBarAnimationChartData } from '../../../../../@core/data/profit-bar-animation-chart';
import { takeWhile, tap, mergeMap, delay } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { NbThemeService } from '@nebular/theme';
import { SolarData } from '../../../../../@core/data/solar';
import { ModuleType, IModuleElement, SourceType } from '../interfaces/module.interfaces';



@Component({
  selector: 'module-list',
  styleUrls: ['./module.list.component.scss'],
  templateUrl: './module.list.component.html',
})
export class ModuleListComponent {
  @Input() modules: Array<IModuleElement> = [];
  public sourceType = SourceType;

  ngOnDestroy() {
  }

}
