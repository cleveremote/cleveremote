import { Component, ViewChild, ElementRef, OnInit, Input, AfterViewChecked } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../../../services/core.data.service';
import { SectorElement } from '../../../../../services/collections/elements/sector.element';
import { RessourcesService } from '../../../../../services/ressources.service';
import { ModuleElement } from '../../../../../services/collections/elements/module.element';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TransceiverElement } from '../../../../../services/collections/elements/transceiver.element';
import { NbIconLibraries } from '@nebular/theme';
import { TYPE_IOCFG, TYPE_IO, TRANSCIEVER_TYPE, TRANSCIEVER_TYPE_LABEL, TRANSCIEVER_STATUS, TRANSCIEVER_STATUS_LABEL, TYPE_IOCFG_LABEL, TYPE_IO_LABEL } from '../../../../../services/collections/elements/interfaces/transceiver.interfaces';


@Component({
  selector: 'module-form',
  styleUrls: ['./module-form.component.scss'],
  templateUrl: './module-form.component.html',
})
export class ModuleFormComponent implements OnInit { //, AfterViewChecked

  public isMobile;
  public subscription = [];
  public deviceForm;
  public previousState = false;

  @Input() data: any;


  constructor(
    private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService,
    private formBuilder: FormBuilder,
    iconsLibrary: NbIconLibraries
  ) {
    this.isMobile = this.deviceService.isMobile();
    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
  }

  ngOnInit(): void {
    this.reload();
  }

  public reload() {
    const element = this.data.element;
    if (this.data.element) {
      this.deviceForm = this.formBuilder.group({
        id: element.id,
        name: element.name,
        status: 'ACTIF',
        port: element.portNum,
        type: element.typeLabel,
        description: element.description,
        prefix: element.prefix,
        suffix: element.suffix,
        applyFunction: element.applyFunction,
        SN: 123456,//element.SN,
        SP: 123456,// element.SP,
        extended: 12356,
        transceiverId: element.transceiverId,
        deviceId: element.deviceId,
      });
    }
  }

  public onSubmit() {
    const formValues = this.deviceForm.value;
  }
}
