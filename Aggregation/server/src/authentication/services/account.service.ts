
import { of as observableOf, from as observableFrom, Observable, of, observable, from, pipe } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';

import { AccountExt } from '../repositories/account.ext';
import { AccountQueryDto } from '../dto/account.query.dto';
import { AccountDto } from '../dto/account.dto';
import { AccountEntity } from '../entities/account.entity';
import { mergeMap } from 'rxjs/operators';
import { Inject, forwardRef } from '@nestjs/common';
import { SchemeService } from '../../manager/services/scheme.service';

export class AccountService {

    constructor(
        @InjectRepository(AccountExt) private readonly accountRepository: AccountExt,
        @Inject(forwardRef(() => SchemeService)) private readonly schemeService: SchemeService
    ) { }

    public get(id: string): Observable<any> {
        return this.accountRepository.getAccount(id);
    }

    public add(accountDto: AccountDto): Observable<any> {
        return this.accountRepository.addAccount(accountDto);
    }

    public update(accountDto: AccountDto): Observable<any> {
        return this.accountRepository.updateAccount(accountDto);
    }

    public delete(id: string): Observable<any> {
        return this.accountRepository.deleteAccount(id);
    }

    public getAll(accountQueryDto: AccountQueryDto): Observable<any> {
        return this.accountRepository.getAll(accountQueryDto);
    }

    public getAccountToSync(serialNumber: string): Observable<any> {
        return this.accountRepository.getAccountToSync(serialNumber);
    }

    public getFrontAccountData(accountId: string): Observable<AccountEntity> {
        return this.accountRepository.getFrontAccountData(accountId)
            .pipe(mergeMap((accountEntity: AccountEntity) => {
                let obsSvgs = of(true);
                accountEntity.devices.forEach(device => {
                    device.schemes.forEach(scheme => {
                        obsSvgs = obsSvgs.pipe(mergeMap(() => this.schemeService.getSvg(scheme.id)))
                            .pipe(mergeMap((svg: any) => {
                                (scheme as any).svg = svg;
                                return of(true);
                            }));
                        scheme.sectors.forEach(sector => {
                            if (sector.schemeDetail) {
                                obsSvgs = obsSvgs.pipe(mergeMap(() => this.schemeService.getSvg(sector.schemeDetail.id)))
                                .pipe(mergeMap((svg: any) => {
                                    (sector.schemeDetail as any).svg = svg;
                                    return of(true);
                                }));
                            }
                        });
                    });
                });
                return obsSvgs.pipe(mergeMap(() => of(accountEntity)));
            }));
    }


}
