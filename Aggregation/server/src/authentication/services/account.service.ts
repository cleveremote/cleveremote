
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';

import { AccountExt } from '../repositories/account.ext';
import { AccountQueryDto } from '../dto/account.query.dto';
import { AccountDto } from '../dto/account.dto';

export class AccountService {

    constructor(
        @InjectRepository(AccountExt) private readonly accountRepository: AccountExt
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


}
