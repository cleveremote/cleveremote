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
  NbToggleModule,
  NbAlertModule,
} from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { ThemeModule } from '../../@theme/theme.module';

import { ChartModule } from 'angular2-chartjs';


import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { NetworkComponent } from './transceivers/network/network.component';
import { ConfigurationComponent } from './configuration.component';
import { GraphComponent } from './transceivers/graph/graph.component';
import { NetworkFormComponent } from './forms/network-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconsComponent } from '../ui-features/icons/icons.component';
import { TransceiverFormComponent } from './forms/elements/transceiver/transceiver-form.component';
import { ModuleFormComponent } from './forms/elements/module/module-form.component';
import { DeviceFormComponent } from './forms/elements/device/device-form.component';

@NgModule({

  imports: [
    NbDialogModule.forChild(),
    NbAlertModule,
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
    FormsModule,
    ReactiveFormsModule,
    NbToggleModule,
  ],
  declarations: [
    GraphComponent,
    NetworkComponent,
    ConfigurationComponent,
    NetworkFormComponent,
    TransceiverFormComponent,
    ModuleFormComponent,
    DeviceFormComponent,
    IconsComponent,
  ],
  entryComponents: [
    NetworkComponent,
    ConfigurationComponent,
    NetworkFormComponent,
    IconsComponent,
    TransceiverFormComponent,
    DeviceFormComponent,
    ModuleFormComponent
  ],
  // providers: [
  //   RessourcesService,
  //   ConfigurationService,
  //   CoreDataService,
  // ],
})
export class ConfigurationModule { }
