/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { FormsModule } from '@angular/forms';

import {
  NbChatModule,
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
} from '@nebular/theme';
import { CoreDataService } from './services/core.data.service';
import { RessourcesService } from './services/ressources.service';
import { ConfigurationService } from './services/configuration.service';
import { AuthInterceptor } from './auth/auth-interceptor.service';
import { AuthGuard } from './auth/auth.guard';
import { DataService } from './services/websocket/websocket.service';
import { TimerService } from './services/timer.service';
import { LoginModule } from './authentication/login/login.module';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { ElementFactory } from './services/collections/elements/element.factory';
import { ModuleCollection } from './services/collections/module.collection';
import { SchemeCollection } from './services/collections/scheme.collection';
import { GroupViewCollection } from './services/collections/groupview.collection';
import { TransceiverCollection } from './services/collections/transceiver.collection';
import { DeviceCollection } from './services/collections/device.collection';
import { SectorCollection } from './services/collections/sector.collection';
import { AccountCollection } from './services/collections/account.collection';
import { UserCollection } from './services/collections/user.collection';
import { ValueCollection } from './services/collections/value.collection';

@NgModule({
  declarations: [AppComponent],
  providers: [
    ConfigurationService,
    AuthGuard,
    DataService,
    TimerService,
    AuthService,
    RessourcesService,
    ConfigurationService,

    ModuleCollection,
    GroupViewCollection,
    TransceiverCollection,
    DeviceCollection,
    SectorCollection,
    SchemeCollection,
    AccountCollection,
    UserCollection,
    ValueCollection,

    CoreDataService,

    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

  ],
  imports: [
    CommonModule,
    LoginModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,

    ThemeModule.forRoot(),

    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    NbToastrModule.forRoot(),
    DeviceDetectorModule.forRoot(),
    NbChatModule.forRoot({
      messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
    }),
    CoreModule.forRoot(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
