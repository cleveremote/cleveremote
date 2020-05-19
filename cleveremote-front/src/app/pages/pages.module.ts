import { NgModule } from '@angular/core';
import { NbMenuModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { ECommerceModule } from './e-commerce/e-commerce.module';
import { PagesRoutingModule } from './pages-routing.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { SchemeModule } from './scheme/scheme.module';
import { CoreDataService } from '../services/core.data.service';
import { ConfigurationService } from '../services/configuration.service';
import { RessourcesService } from '../services/ressources.service';
import { ConfigurationModule } from './configuration/configuration.module';

@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    NbMenuModule,
    DashboardModule,
    ECommerceModule,
    MiscellaneousModule,
    SchemeModule,
    ConfigurationModule,
  ],
  declarations: [
    PagesComponent,
  ],
  providers: [
    RessourcesService,
    ConfigurationService
  ]
})
export class PagesModule {
}