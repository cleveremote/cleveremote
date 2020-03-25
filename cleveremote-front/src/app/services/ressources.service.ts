import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class RessourcesService {

    private actionUrl: string;

    constructor(private http: HttpClient,
        private configurationService: ConfigurationService) {
        this.actionUrl = `${configurationService.apiHost}${configurationService.apiPrefix}`;
    }

    getAccountDevices(accountId: string): Observable<any> {
        return this.http.get<any>(this.actionUrl + 'device/all?accountId=' + accountId);
    }

    getDeviceModules(deviceId: string): Observable<any> {
        return this.http.get<any>(this.actionUrl + 'module/device/' + deviceId);
    }

    getAccountModules(accountId: string): Observable<any> {
        return this.http.get<any>(this.actionUrl + 'module/account/' + accountId);
    }


    postLogin(jsonBody): Observable<any> {
        return this.http.post<void>(this.actionUrl + 'authentication/login', jsonBody);
    }

    getNewToken(): Observable<any> {
        return this.http.get<void>(this.actionUrl + 'authentication/token');
    }

    getScheme(schemeId: string): Observable<any> {
        return this.http.get<void>(this.actionUrl + 'scheme/svg/' + schemeId);
    }

}
