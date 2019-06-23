import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ApiRequestsService } from "../../services/api-requests.service";
import { AuthService } from "../../auth/auth.service";
import { UserIdleService } from 'angular-user-idle';
import { timer, Subscription } from 'rxjs';
import { DataService } from '../../services/websocket/websocket.service';
import { TimerService } from '../../services/timer.service';

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
  @ViewChild('modal') modal: ElementRef;
  public testEntries: any = [];
  public userData: any = {};
  public downloadTimer: any;
  public webSocketsub: Subscription;
  public isCollapsed = true;
  private modalReference = null;
  public counterLogout = 0;
  private isModalOpened = false;
  constructor(
    private userIdle: UserIdleService,
    private apiRequestsService: ApiRequestsService,
    private authService: AuthService,
    private dataService: DataService,
    private timerService: TimerService) { }

  ngOnInit() {
    // var burger = document.querySelector('.burger') as any;
    // var nav = document.querySelector('#'+burger.dataset.target);
   
    // burger.addEventListener('click', function(){
    //   burger.classList.toggle('is-active');
    //   nav.classList.toggle('is-active');
    // });
     this.timerService.userIdle = this.userIdle;
     this.timerService.modalInstance = this.modal;
     this.timerService.initInactivity();

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

  logout() {
    if (this.timerService.oauthTimerObs) {
      this.timerService.oauthTimerObs.unsubscribe();
      this.timerService.oauthTimerObs = undefined;
    }

    if (this.timerService.tokenTimer) {
      clearTimeout(this.timerService.tokenTimer);
      this.timerService.tokenTimer = 0;
    }

    this.authService.logout();
  }

  public getTests(): void {
    this.apiRequestsService.getTests().subscribe(response => this.testEntries = response);
  }

  openVerticallyCentered(content) {
    this.modal.nativeElement.classList.toggle('is-active');
    //this.modalReference = this.modalService.open(content, { centered: true });
  }

  ngOnDestroy() {
    this.timerService.stopWatchingActivity();
    this.webSocketsub.unsubscribe();
  }

}
