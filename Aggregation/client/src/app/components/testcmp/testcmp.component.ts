import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestsService } from "../../services/api-requests.service";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { DataService } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';

export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}

@Component({
  selector: 'app-testcmp',
  templateUrl: './testcmp.component.html',
  styleUrls: ['./testcmp.component.css']
})
export class TestcmpComponent implements OnInit, OnDestroy {
  public loginData: any = {};
  sub: Subscription;
  


  constructor(private apiRequestsService: ApiRequestsService,
    public router: Router,
    private authService: AuthService,
    private dataService: DataService) {
  }

  ngOnInit() {

    

    this.sub = this.dataService.observable.subscribe((x) => {
      const t = x;
    });

  }

  public send(): void {
    const message = new Message("this.sender", "this.clientMessage", true);

    this.dataService.serverMessages.push(message);
    this.dataService.socket.next(message);
  }

  public onLoginSubmit() {
    this.authService.login(this.loginData.email, this.loginData.password);
  }

  public loginGoogle() {
    //this.authService.loginSocial("GOOGLE");
    this.send();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
