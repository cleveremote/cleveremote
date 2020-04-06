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

    getAllLastModuleValues(moduleIds: Array<string>): Observable<any> {
        return this.http.post<any>(this.actionUrl + 'module/values/', moduleIds);
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

    addModulesToGroup(modules: Array<string>, goupId: string): Observable<any> {
        return this.http.put<void>(this.actionUrl + 'groupview/' + goupId + '/', modules);
    }

    deleteModulesFromGroup(modules: Array<string>, goupId: string): Observable<any> {
        return this.http.post<void>(this.actionUrl + 'groupview/' + goupId + '/', modules);
    }

    getFrontAccountData(): Observable<any> {
        return this.http.get<any>(this.actionUrl + 'account/front-data/' + 'server_1');
    }

    getSector(sectorId: string): Observable<any> {
        return this.http.get<any>(this.actionUrl + 'sector/' + sectorId);
    }

    execute(jsonBody): Observable<any> {
        return this.http.post<boolean>(this.actionUrl + 'module/execute', jsonBody);
    }

    updateSector(jsonBody): Observable<any> {
        return this.http.put<any>(this.actionUrl + 'sector/', jsonBody);
    }

}
