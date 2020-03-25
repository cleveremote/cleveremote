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

import { ChartModule } from 'angular2-chartjs';


import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { NetworkComponent } from './transceivers/network/network.component';
import { ConfigurationComponent } from './configuration.component';
import { GraphComponent } from './transceivers/graph/graph.component';

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
    GraphComponent,
    NetworkComponent,
    ConfigurationComponent
  ],
  entryComponents: [
    NetworkComponent,
    ConfigurationComponent,
  ],
  // providers: [
  //   RessourcesService,
  //   ConfigurationService,
  //   CoreDataService,
  // ],
})
export class ConfigurationModule { }
