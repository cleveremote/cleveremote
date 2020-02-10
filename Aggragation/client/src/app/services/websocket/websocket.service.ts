import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { share, flatMap, mergeMap, map, retryWhen, tap, delay, startWith, switchMap, catchError, } from 'rxjs/operators';

//import { Socket } from '../shared/interfaces';

//import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import { webSocket } from "rxjs/webSocket";
import { AuthService } from '../../auth/auth.service';
import { Subject, of, throwError } from 'rxjs';
import { TimerService } from '../timer.service';

export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}



@Injectable()
export class DataService implements OnDestroy {


  public socket: any;
  observer: Observer<Message>;
  public observable: Observable<Message>;

  public loginData: any = {};
  public serverMessages = new Array<Message>();
  public clientMessage = '';
  public isBroadcast = false;
  public sender = '';
  public obsMessage = null;

  constructor(private timerService: TimerService,
    private authService: AuthService) {
    this.initWebSocket();
    this.observable = this.createObservable().pipe(share());
    this.obsMessage = this.timerService.chatMessageAdded.subscribe((data) => {
      if (data === 'refreshToken') {
        this.refreshTokenAndWebSocket().subscribe();
      }
    });
  }

  public restartWebSocket() {
    this.stopWebSocket();
    this.initWebSocket();
  }

  public stopWebSocket() {
    if (this.socket) {
      this.socket.unsubscribe();
      this.socket = undefined;
    }
  }

  public initWebSocket() {
    const token = this.authService.getToken();
    this.socket = webSocket({
      url: "ws://192.168.1.30:3100",
      closeObserver: {
        next: (closeEvent) => {
          const customError = { code: closeEvent.code, reason: closeEvent.reason };
          console.log(`code: ${customError.code}, reason: ${customError.reason}`);
          if (customError.code === 1000) {
            this.restartWebSocket();
          }
        }
      },
      protocol: [token]
    });
    this.startWebSocket();
  }

  public startWebSocket() {
    this.socket.pipe(
      retryWhen(errors =>
        errors.pipe(
          tap(err => {
            console.error('error!', err)
          }),
          delay(5000)
        )
      )
    ).subscribe({
      next: (message: Message) => {
        if (this.observer && message) {
          this.observer.next(message);
        }
        this.serverMessages.push(message);
      },
      error: (err: any) => console.error('test', err),
      complete: () => console.warn('Completed!')
    });
  }

  ngOnDestroy() {
    this.stopWebSocket();
    this.obsMessage.unsubscribe();
    console.log('Service destroy');
  }

  getQuotes(): Observable<Message> {
    return this.createObservable();
  }

  createObservable(): Observable<Message> {
    return new Observable<Message>(observer => {
      this.observer = observer;
    });
  }

  private handleError(error) {
    console.error('server error:', error);
    if (error.error instanceof Error) {
      const errMessage = error.error.message;
      return Observable.throw(errMessage);
    }
    return Observable.throw(error || 'Socket.io server error');
  }

  public refreshTokenAndWebSocket(): Observable<boolean> {
    return this.authService.refreshToken().pipe(mergeMap((response: any) => {
      this.restartWebSocket();
      return of(true);
    }));
  }
}
