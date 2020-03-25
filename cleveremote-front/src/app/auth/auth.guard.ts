import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, pipe } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from "./auth.service";
import { DataService } from '../services/websocket/websocket.service';
import { throwError } from 'rxjs/internal/observable/throwError';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private webSocketService: DataService, private oaut: AuthService, private router: Router) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    return this.webSocketService.refreshTokenAndWebSocket().pipe(
      catchError(err => {
        console.log('Handling error locally and rethrowing it...', err);
        this.router.navigate(['/login']);
        return throwError(err);
      })
    ).pipe(map(
      (data: any) => {
        const isAuth = this.oaut.getIsAuth();
        if (!isAuth) {
          this.router.navigate(['/login']);
        }
        return isAuth;
      }
    ));

  }
}
