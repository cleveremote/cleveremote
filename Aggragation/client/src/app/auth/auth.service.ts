import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { AuthData } from "./auth-data.model";
import { ApiRequestsService } from "../services/api-requests.service";
import { UserIdleService } from 'angular-user-idle';
import { tap } from 'rxjs/operators';
import { TimerService } from '../services/timer.service';

@Injectable({ providedIn: "root" })
export class AuthService implements OnDestroy {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();
  private userId: string;
  public event: any;
  public modalReference = null;
  public counterLogout = 0;
  public isModalOpened = false;
  public obsMessage = null;

  constructor(private http: HttpClient,
    private router: Router,
    private apiRequestsService: ApiRequestsService,
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

  getIsAuth() {
    return this.isAuthenticated;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  createUser(email: string, password: string) {
    const authData: AuthData = { email: email, password: password };

    this.apiRequestsService.postSignup(authData).subscribe(response => {
      if (response.success) {
        this.router.navigate(['login']);
      }
    });
  }



  login(email: string, password: string) {

    const authData: AuthData = { email: email, password: password };
    this.apiRequestsService.postLogin(authData).subscribe(response => {
      const token = response.token;
      this.token = token;
      if (token) {
        const expiresInDuration = response.expiresIn;
        this.timerService.setAuthTimer(expiresInDuration);
        this.isAuthenticated = true;
        this.userId = response.user._id;
        this.authStatusListener.next(true);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
        console.log(expirationDate);
        this.saveAuthData(token, expirationDate, this.userId);
        this.router.navigate(["/profile"]);
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
        this.userId = response.user._id;
        this.authStatusListener.next(true);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
        console.log(expirationDate);
        this.saveAuthData(token, expirationDate, this.userId);
      }
    }));
  }

  public loginSocial(social: any) {
    switch (social) {
      case "GOOGLE":
        window.open('api/auth/google', "mywindow", "location=1,status=1,scrollbars=1, width=800,height=800");
        let listener = window.addEventListener('message', (message) => {
          const user = message.data.user;
          this.saveGoogle(user._id, user.google);
        });
        break;

      default:
        break;
    }
  }

  saveGoogle(userId: any, googleInfo: any) {
    const token = googleInfo.token;
    this.token = token;
    if (token) {
      const expiresInDuration = googleInfo.expiresIn;
      //this.timerService.setAuthTimer(Number(expiresInDuration));
      this.isAuthenticated = true;
      this.userId = userId;
      this.authStatusListener.next(true);
      const now = new Date();
      const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
      console.log(expirationDate);
      this.saveAuthData(token, expirationDate, this.userId);
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
      this.userId = authInformation.userId;
      this.timerService.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    this.clearAuthData();
    this.router.navigate(["/"]);
    this.userId = null;
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration", expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
  }

  private getAuthData() {
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    if (!token || !expirationDate || !userId) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId
    };
  }
}
