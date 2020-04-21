import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { ProvideryDto } from '../dto/provider.dto';
import { ProviderQueryDto } from '../dto/provider.query.dto';
import { UserService } from '../services/user.service';
import { ProviderService } from '../services/provider.service';

@Controller('provider')
export class ProviderController {
    constructor(private readonly providerService: ProviderService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) providerQueryDto: ProviderQueryDto): Observable<boolean> {
        return this.providerService.getAll(providerQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.providerService.get(id);
    }

    @Delete('/:providerId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('providerId') moduleId: string): Observable<boolean> {
        return this.providerService.delete(moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() userDto: ProvideryDto): Observable<any> {
        return this.providerService.update(userDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() userDto: ProvideryDto): Observable<any> {
        return this.providerService.add(userDto);
    }

}
