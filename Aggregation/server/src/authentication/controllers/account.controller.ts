import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { AccountQueryDto } from '../dto/account.query.dto';
import { AccountDto } from '../dto/account.dto';
import { AccountService } from '../services/account.service';

@Controller('api/account')
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) userQueryDto: AccountQueryDto): Observable<boolean> {
        return this.accountService.getAll(userQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.accountService.get(id);
    }

    @Get('getAccountToSync/:serialNumber')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public getAccountToSync(@Param('serialNumber') serialNumber: string): Observable<boolean> {
        return this.accountService.getAccountToSync(serialNumber);
    }

    @Delete('/:accountId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('accountId') moduleId: string): Observable<boolean> {
        return this.accountService.delete(moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() accountDto: AccountDto): Observable<any> {
        return this.accountService.update(accountDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() accountDto: AccountDto): Observable<any> {
        return this.accountService.add(accountDto);
    }

}
