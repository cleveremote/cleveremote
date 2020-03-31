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
  NbTooltipModule,
  NbAlertModule,
  NbPopoverModule,
} from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { ThemeModule } from '../../@theme/theme.module';
import { SchemeComponent } from './scheme.component';

import { ChartModule } from 'angular2-chartjs';


import { LeafletModule } from '@asymmetrik/ngx-leaflet';


import { SchemeSvgComponent } from './components/scheme/schemesvg.component';
import { ModuleComponent } from './components/module/module.component';
import { ModuleListAllComponent } from './components/module/module-list-all/module-list-all.component';
import { ModuleListComponent } from './components/module/module-list/module-list.component';
import { ModuleElementComponent } from './components/module/module.element/module-element.component';

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
    NbPopoverModule,
    NbAlertModule,
  ],
  declarations: [
    ModuleComponent,
    ModuleListAllComponent,
    ModuleListComponent,
    SchemeComponent,
    SchemeSvgComponent,
    ModuleElementComponent,
  ],
  entryComponents: [
    ModuleComponent,
    ModuleListAllComponent,
    ModuleListComponent,
    ModuleElementComponent,
  ],
})
export class SchemeModule { }
