import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { tap } from 'rxjs/operators';
import { TimerService } from '../services/timer.service';
import { RessourcesService } from '../services/ressources.service';

@Injectable({ providedIn: "root" })
export class AuthService implements OnDestroy {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();

  private userId: string;
  private accountId: string;
  private sessionId: string;

  public event: any;
  public modalReference = null;
  public counterLogout = 0;
  public isModalOpened = false;
  public obsMessage = null;

  constructor(private http: HttpClient,
    private router: Router,
    private apiRequestsService: RessourcesService,
    private timerService: TimerService
  ) {
    this.refreshToken();
    this.obsMessage = this.timerService.chatMessageAdded.subscribe((data) => {
      if (data === 'logout') {
        this.logout();
      }
    });
  }

  getToken() {
    return this.token;
  }

  getUserId() {
    return this.userId;
  }

  geSessionId() {
    return this.sessionId;
  }

  geAccountId() {
    return this.accountId;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }


  login(email: string, password: string) {

    const authData = { username: email, password: password };
    this.apiRequestsService.postLogin(authData).subscribe(response => {
      const token = response.token;
      this.token = token;
      if (token) {
        const expiresInDuration = response.expiresIn;
        this.timerService.setAuthTimer(expiresInDuration);
        this.isAuthenticated = true;
        this.userId = response.user.id;
        this.sessionId = response.user.sessionId;
        this.accountId = response.user.accountId;
        this.authStatusListener.next(true);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
        console.log(expirationDate);
        this.saveAuthData(token, expirationDate, this.userId, this.accountId, this.sessionId);
        this.router.navigate(["/pages/Scheme"]);
      }
    });
  }

  public refreshToken() {
    return this.apiRequestsService.getNewToken().pipe(tap(response => {
      const token = response.token;
      this.token = token;
      if (token) {
        const expiresInDuration = response.expiresIn;
        this.timerService.setAuthTimer(expiresInDuration);
        this.isAuthenticated = true;
        this.userId = response.user.id;
        this.sessionId = response.user.sessionId;
        this.accountId = response.user.accountId;
        this.authStatusListener.next(true);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
        console.log(expirationDate);
        this.saveAuthData(token, expirationDate, this.userId, this.accountId, this.sessionId);
      }
    }));
  }

  public loginSocial(social: any) {
    switch (social) {
      case "GOOGLE":
        window.open('api/authentication/google', "mywindow", "location=1,status=1,scrollbars=1, width=800,height=800");
        let listener = window.addEventListener('message', (message) => {
          const response = message.data.user;
          this.saveGoogle(response);
        });
        break;

      default:
        break;
    }
  }


  saveGoogle(response) {
    const token = response.token;
    this.token = token;
    if (token) {
      const expiresInDuration = response.expiresIn;
      this.timerService.setAuthTimer(Number(expiresInDuration));
      this.isAuthenticated = true;
      this.userId = response.data.id;
      this.sessionId = response.data.sessionId;
      this.accountId = response.data.accountId;
      this.authStatusListener.next(true);
      const now = new Date();
      const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
      console.log(expirationDate);
      this.saveAuthData(token, expirationDate, this.userId, this.accountId, this.sessionId);
      this.router.navigate(["/"]);
    }
  }

  ngOnDestroy() {

    this.obsMessage.unsubscribe();
    console.log('Service destroy auth');
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      return;
    }
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.userId = authInformation.id;
      this.accountId = authInformation.accountId;
      this.sessionId = authInformation.sessionId;
      this.timerService.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    this.clearAuthData();
    this.router.navigate(["/login"]);
    this.userId = null;
    this.accountId = null;
    this.sessionId = null;
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string, accountId: string, sessionId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('id', userId);
    localStorage.setItem('accountId', accountId);
    localStorage.setItem('sessionId', sessionId);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("id");
  }

  private getAuthData() {
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("id");
    const accountId = localStorage.getItem("accountId");
    const sessionId = localStorage.getItem("sessionId");
    if (!token || !expirationDate || !userId) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      id: userId,
      accountId: accountId,
      sessionId: sessionId
    };
  }
}
