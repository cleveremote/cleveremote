import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
//import { AuthService } from "../../auth/auth.service";
import { DataService } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NbLoginComponent } from '@nebular/auth';
import { AuthGuard } from '../../auth/auth.guard';




@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent extends NbLoginComponent implements OnInit, OnDestroy {
  public loginData: any = {};
  sub: Subscription;


  constructor(private authService: AuthService) {
    super(null, null, null, null);
  }
  login(): void {
     //this.authService.login('nadime.yahyaoui@gmail.com', 'test');
    this.authService.loginSocial('GOOGLE');
  }

  // constructor(public router: Router,
  //   private authService: AuthService) {
  // }

  ngOnInit() {

  }

  public onLoginSubmit() {
    // this.authService.login(this.loginData.email, this.loginData.password);
    // this.authService.loginSocial('GOOGLE');
  }

  public loginGoogle() {
    this.authService.loginSocial('GOOGLE');
  }

  ngOnDestroy() {
  }
}
