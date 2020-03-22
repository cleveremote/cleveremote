import { Component, ViewChild, ElementRef } from '@angular/core';
import { ProfitBarAnimationChartData } from '../../../../@core/data/profit-bar-animation-chart';
import { takeWhile, tap, mergeMap, delay } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

enum Status {
  SELECT = 'rgb(0, 150, 136)',
  WARNING = '#FFCD00',
  ERROR = '#FF0000',
  INPROCCESS = '#0000FF',
  DEFAULT = 'rgba(255, 255, 255, 0)'
}

@Component({
  selector: 'ngx-stats-card-front',
  styleUrls: ['./stats-card-front.component.scss'],
  templateUrl: './stats-card-front.component.html',
})
export class StatsCardFrontComponent {
  private alive = true;
  public svg: any;
  public inputSector: string;



  linesData: { firstLine: number[]; secondLine: number[] };

  constructor(private http: HttpClient,
    private profitBarAnimationChartService: ProfitBarAnimationChartData, private sanitizer: DomSanitizer) {
    this.profitBarAnimationChartService.getChartData()
      .pipe(takeWhile(() => this.alive))
      .subscribe((linesData) => {
        this.linesData = linesData;
      });
  }

  ngOnInit() {

  }



}
