import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestsService } from "../../services/api-requests.service";
import { AuthService } from "../../auth/auth.service";
import { UserIdleService } from 'angular-user-idle';
import { timer, Subscription } from 'rxjs';
import { DataService } from '../../services/websocket/websocket.service';

export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [DataService]
})



export class ProfileComponent implements OnInit, OnDestroy {

  public testEntries: any = [];
  public userData: any = {};
  public downloadTimer: any;
  public webSocketsub: Subscription;
  constructor(
    private userIdle: UserIdleService,
    private apiRequestsService: ApiRequestsService,
    private authService: AuthService,
    private dataService: DataService) { }

  ngOnInit() {
    this.initInactivity();

    this.webSocketsub = this.dataService.observable.subscribe((x) => {
      const t = x;
    });

    this.apiRequestsService.getAllLogs('server_1').subscribe(response => {
      const t = 2;
    });

  }

  public send(): void {
    const message = new Message("this.sender", "this.clientMessage", true);
    this.dataService.serverMessages.push(message);
    this.dataService.socket.next(message);
  }


  public initInactivity(){
   this.restartWatching();
    const coundownCmp  = document.getElementById("countdown");
    this.userIdle.onTimerStart().subscribe(count => {
      if (count !== null) {
        coundownCmp.innerHTML = (11 - count) + " seconds remaining";
        if (count >= 10) {
          coundownCmp.innerHTML = "Finished"
          this.logout();
        }
      } else if(coundownCmp) {
        coundownCmp.innerHTML = null;
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  public restartWatching(refreshToken:boolean=false) {
    if(refreshToken){
      this.authService.refreshToken().subscribe((response)=>{
        this.dataService.restartWebSocket();
      });
    }
    document.getElementById("countdown")?document.getElementById("countdown").innerHTML = null:document.getElementById("countdown").innerHTML;
    this.userIdle.stopWatching();
    this.userIdle.startWatching();
  }

  public getTests(): void {
    this.apiRequestsService.getTests().subscribe(response => this.testEntries = response);
  }

  ngOnDestroy() {
    this.userIdle.stopWatching();
    this.webSocketsub.unsubscribe();
  }

}
