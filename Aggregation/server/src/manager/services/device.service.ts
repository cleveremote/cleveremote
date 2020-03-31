
import { mergeMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { forwardRef, Inject } from '@nestjs/common';
import { DeviceExt } from '../repositories/device.ext';
import { DeviceDto } from '../dto/device.dto';
import { DeviceQueryDto } from '../dto/device.query.dto';
import { SchemeService } from './scheme.service';

export class DeviceService {

    constructor(
        @InjectRepository(DeviceExt) private readonly deviceRepository: DeviceExt,
        @Inject(forwardRef(() => SchemeService)) private readonly schemeService: SchemeService
    ) { }

    public get(id: string): Observable<any> {
        return this.deviceRepository.getDevice(id);
    }

    public add(deviceDto: DeviceDto): Observable<any> {
        return this.deviceRepository.addDevice(deviceDto);
    }

    public update(moduleDto: DeviceDto): Observable<any> {
        return this.deviceRepository.updateDevice(moduleDto);
    }

    public delete(id: string): Observable<any> {
        return this.deviceRepository.deleteDevice(id);
    }

    public getAll(deviceQueryDto: DeviceQueryDto): Observable<any> {
        return this.deviceRepository.getAll(deviceQueryDto)
            .pipe(mergeMap((devices) => {
                let obsSvgs = of(true);
                devices.forEach(device => {
                    device.schemes.forEach(scheme => {
                        obsSvgs = obsSvgs.pipe(mergeMap(() => this.schemeService.getSvg(scheme.id)))
                        .pipe(mergeMap((svg) => {
                            (scheme as any).svg = svg;
                            return of(true);
                        }));
                    });

                });
                return obsSvgs.pipe(mergeMap(() => of(devices)))
            }));
    }
}
