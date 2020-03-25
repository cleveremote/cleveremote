import { NgModule } from '@angular/core';
import {
  NbButtonModule,
  NbCardModule,
  NbProgressBarModule,
  NbTabsetModule,
  NbUserModule,
  NbIconModule,
  NbSelectModule,
  NbListModule,
  NbDialogModule,
  NbInputModule,
  NbCheckboxModule,
} from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { ThemeModule } from '../../@theme/theme.module';
import { SchemeComponent } from './e-commerce.component';
import { ProfitCardComponent } from './profit-card/profit-card.component';

import { ChartModule } from 'angular2-chartjs';
import { StatsCardBackComponent } from './profit-card/back-side/stats-card-back.component';
import { StatsAreaChartComponent } from './profit-card/back-side/stats-area-chart.component';
import { StatsCardFrontComponent } from './profit-card/front-side/stats-card-front.component';


import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { EarningCardComponent } from './earning-card/earning-card.component';
import { EarningCardBackComponent } from './earning-card/back-side/earning-card-back.component';
import { EarningPieChartComponent } from './earning-card/back-side/earning-pie-chart.component';
import { EarningCardFrontComponent } from './earning-card/front-side/earning-card-front.component';
import { EarningLiveUpdateChartComponent } from './earning-card/front-side/earning-live-update-chart.component';
import { SchemeSvgComponent } from './components/scheme/schemesvg.component';
import { ModuleComponent } from './components/module/module.component';
import { ModuleListAllComponent } from './components/module/module-list-all/module.list.all.component';
import { ModuleListComponent } from './components/module/module-list/module.list.component';
import { DialogNamePromptComponent } from '../modal-overlays/dialog/dialog-name-prompt/dialog-name-prompt.component';
import { StatusCardComponent } from './components/module/module.element/status-card.component';
import { CoreDataService } from '../../services/core.data.service';
import { RessourcesService } from '../../services/ressources.service';
import { ConfigurationService } from '../../services/configuration.service';

@NgModule({
 
  imports: [
    NbDialogModule.forChild(),
    NbCheckboxModule,
    NbInputModule,
    ThemeModule,
    NbCardModule,
    NbUserModule,
    NbButtonModule,
    NbIconModule,
    NbTabsetModule,
    NbSelectModule,
    NbListModule,
    ChartModule,
    NbProgressBarModule,
    NgxEchartsModule,
    NgxChartsModule,
    LeafletModule,
  ],
  declarations: [
    ModuleComponent,
    ModuleListAllComponent,
    ModuleListComponent,
    SchemeComponent,
    StatsCardFrontComponent,
    StatsAreaChartComponent,
    ProfitCardComponent,
    StatsCardBackComponent,
    EarningCardComponent,
    EarningCardFrontComponent,
    EarningCardBackComponent,
    EarningPieChartComponent,
    EarningLiveUpdateChartComponent,
    SchemeSvgComponent,
    StatusCardComponent,
  ],
  entryComponents: [
    ModuleComponent,
    ModuleListAllComponent,
    ModuleListComponent,
    StatusCardComponent,
  ],
  // providers: [
  //   RessourcesService,
  //   ConfigurationService,
  //   CoreDataService,
  // ],
})
export class SchemeModule { }
