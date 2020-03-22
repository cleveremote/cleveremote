import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { HomeComponent } from "./home/home.component";
import { SignupComponent } from "./signup/signup.component";
import { ViewportComponent } from "./viewport/viewport.component";
import { TestComponentComponent } from "./test-component/test-component.component";
import { AuthGuard } from "../auth/auth.guard";
import { DashboardComponent } from './dashboard/dashboard.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { SchemeComponent } from './scheme/scheme.component';

const routes: Routes = [
  { path: 'login', redirectTo: '/login', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: '', component: ViewportComponent, canActivate: [AuthGuard],
    children: [
      {
        path: 'scheme',
        component: SchemeComponent
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'configuration',
        component: ConfigurationComponent,
      }
    ]
  },
  { path: 'test', component: TestComponentComponent },
  { path: '**', component: PageNotFoundComponent },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
