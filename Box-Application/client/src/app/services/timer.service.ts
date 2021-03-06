import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { ApiRequestsService } from "../services/api-requests.service";
import { UserIdleService } from 'angular-user-idle';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../auth/auth.service';
import { DataService } from './websocket/websocket.service';
import { Subject, timer } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable()
export class TimerService {
    public modalReference = null;
    public modalInstance = null;
    private oauthTimerObs = null;
    public counterLogout = 0;
    public isModalOpened = false;
    private tokenTimer: any;
    public userIdle: UserIdleService;
    public chatMessageAdded: any;

    constructor(private http: HttpClient,
        private router: Router,
        private apiRequestsService: ApiRequestsService,
        private modalService: NgbModal) {
        this.chatMessageAdded = new Subject();
    }

    public setAuthTimer(duration: number) {
        this.tokenTimer = setTimeout(() => {
            this.oauthTimerObs = timer(1000, 1000).pipe(take(10)).subscribe((count) => {
                if (count !== null) {
                    if (!this.isModalOpened) {
                        this.modalInstance = this.modalService.open(this.modalReference, { centered: true });
                        this.isModalOpened = true;
                    }
                    this.counterLogout = (10 - count);
                    if (count >= 9) {
                        this.counterLogout = 0;
                        this.logout();
                    }
                }
            });
        }, (duration - 10) * 1000);
    }

    public initInactivity() {
        this.restartWatching();

        this.userIdle.onTimerStart().subscribe(count => {
            if (count !== null) {
                if (!this.isModalOpened) {
                    this.modalInstance = this.modalService.open(this.modalReference, { centered: true });
                    this.isModalOpened = true;
                }
                this.counterLogout = (11 - count);
                if (count >= 10) {
                    this.counterLogout = 0;
                    this.logout();
                }
            }
        });
    }

    public restartWatching(refreshToken: boolean = false) {
        this.closeModal();

        if (refreshToken) {
            this.chatMessageAdded.next("refreshToken");
        }

        this.userIdle.stopWatching();
        this.userIdle.startWatching();


    }

    private closeModal() {
        if (this.isModalOpened) {
            if (this.oauthTimerObs) {
                this.oauthTimerObs.unsubscribe();
                this.oauthTimerObs = undefined;
            }
            this.modalInstance.close();
            this.isModalOpened = false;
            if (this.tokenTimer) {
                clearTimeout(this.tokenTimer);
                this.tokenTimer = 0;
            }
        }
    }

    logout() {
        this.closeModal();
        this.chatMessageAdded.next("logout");
    }

    public stopWatchingActivity() {
        this.userIdle.stopWatching();
    }

}
