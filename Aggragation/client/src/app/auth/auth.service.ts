import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

import { AuthData } from "./auth-data.model";
import { ApiRequestsService } from "../services/api-requests.service";
import { UserIdleService } from 'angular-user-idle';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: "root" })
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();
  private userId: string;
  public event: any;
  constructor(private http: HttpClient, private router: Router, private apiRequestsService: ApiRequestsService) {

    window.addEventListener("message", (event) => {
      if (event.origin !== "http://localhost:4000")
        return;
      this.event = event;
    }, false);

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
        this.setAuthTimer(expiresInDuration);
        this.isAuthenticated = true;
        this.userId = response.user._id;
        this.authStatusListener.next(true);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
        console.log(expirationDate);
        this.saveAuthData(token, expirationDate, this.userId);
        // const userId = this.userId;
        // window.parent.postMessage({ token, expirationDate, userId }, "*");
        // (<any>window).data = { token, expirationDate, userId };
        this.router.navigate(["/profile"]);
        //window.close();
      }
    });
  }

  public refreshToken() {
    return this.apiRequestsService.getNewToken().pipe(tap(response => {
      const token = response.token;
      this.token = token;
      if (token) {
        const expiresInDuration = response.expiresIn;
        this.setAuthTimer(expiresInDuration);
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
      this.setAuthTimer(Number(expiresInDuration));
      this.isAuthenticated = true;
      this.userId = userId;
      this.authStatusListener.next(true);
      const now = new Date();
      const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
      console.log(expirationDate);
      this.saveAuthData(token, expirationDate, this.userId);
      //this.router.navigate(["/profile"]);
    }
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
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(["/"]);
    this.userId = null;
  }

  private setAuthTimer(duration: number) {

    
   

    this.tokenTimer = setTimeout(() => {
      // this.logout();
      const coundownCmp = document.getElementById("countdown");
      const count = 9;
      if (count !== null) {
        coundownCmp.innerHTML = (11 - count) + " seconds remaining";
        if (count >= 10) {
          coundownCmp.innerHTML = "Finished"
          this.logout();
        }
      } else if (coundownCmp) {
        coundownCmp.innerHTML = null;
      }
    }, duration * 1000);
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
