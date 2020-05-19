import { Component, ViewChild, ElementRef, OnInit, Input, AfterViewChecked, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../services/core.data.service';
import { SectorElement } from '../../../services/collections/elements/sector.element';
import { RessourcesService } from '../../../services/ressources.service';
import { ModuleElement } from '../../../services/collections/elements/module.element';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TransceiverElement } from '../../../services/collections/elements/transceiver.element';
import { NbIconLibraries } from '@nebular/theme';
import { TransceiverFormComponent } from './elements/transceiver/transceiver-form.component';
import { ModuleFormComponent } from './elements/module/module-form.component';

@Component({
  selector: 'network-form',
  styleUrls: ['./network-form.component.scss'],
  templateUrl: './network-form.component.html',
})
export class NetworkFormComponent implements OnInit {

  public isMobile;
  public subscription = [];
  public deviceForm;
  public previousState = false;
  public visible = false;

  @Input() revealed: any;
  @Input() data: any;
  @ViewChild('form', { static: false }) private form: any;
  public hasPending = false;

  constructor(private deviceService: DeviceDetectorService,
    iconsLibrary: NbIconLibraries,
  ) {
    this.isMobile = this.deviceService.isMobile();
    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
  }

  ngOnInit(): void {

  }

  save() {
    (this.form as any).onSubmit();
    this.revealed.visible = !this.revealed.visible;
  }

  cancel() {
    this.revealed.visible = !this.revealed.visible;
  }
}
