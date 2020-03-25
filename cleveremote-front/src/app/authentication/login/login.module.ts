import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { NbCardModule, NbUserModule, NbButtonModule, NbTabsetModule, NbActionsModule, NbRadioModule, NbSelectModule, NbListModule, NbIconModule, NbInputModule, NbCheckboxModule } from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { LoginComponent } from './login.component';

@NgModule({
  imports: [
    FormsModule,
    FormsModule,
    ThemeModule,
    NbCardModule,
    NbUserModule,
    NbButtonModule,
    NbTabsetModule,
    NbActionsModule,
    NbRadioModule,
    NbSelectModule,
    NbListModule,
    NbIconModule,
    NbButtonModule,
    NgxEchartsModule,
    NbInputModule,
    NbCheckboxModule,
  ],
  declarations: [
    LoginComponent,
  ],
  // providers: [
  //   RessourcesService,
  //   ConfigurationService,
  //   CoreDataService
  // ]
})
export class LoginModule {
}
