import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestsService } from "../../services/api-requests.service";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { DataService } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';




@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginData: any = {};
  sub: Subscription;
  


  constructor(private apiRequestsService: ApiRequestsService,
    public router: Router,
    private authService: AuthService) {
  }

  // ,
  //   private dataService: DataService
  ngOnInit() {

    // this.socket$ = new WebSocketSubject('ws://localhost:3000');

    //     this.socket$
    //         .subscribe(
    //         (message) => this.serverMessages.push(message),
    //         (err) => console.error(err),
    //         () => console.warn('Completed!')
    //         );

    // this.sub = this.dataService.observable.subscribe((x) => {
    //   const t = x;
    // });

  }

  

  public onLoginSubmit() {
    this.authService.login(this.loginData.email, this.loginData.password);
  }

  public loginGoogle() {
    //this.authService.loginSocial("GOOGLE");
    //this.send();
  }

  ngOnDestroy() {
    // this.sub.unsubscribe();
  }
}
