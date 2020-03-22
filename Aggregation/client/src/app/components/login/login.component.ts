import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestsService } from "../../services/api-requests.service";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { DataService } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';




@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginData: any = {};
  sub: Subscription;

  constructor(private apiRequestsService: ApiRequestsService,
    public router: Router,
    private authService: AuthService) {
  }

  ngOnInit() {

  }

  public onLoginSubmit() {
    // this.authService.login(this.loginData.email, this.loginData.password);
    this.authService.loginSocial('GOOGLE');
  }

  public loginGoogle() {
  }

  ngOnDestroy() {
  }
}
