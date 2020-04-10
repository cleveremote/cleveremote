import { Component, ViewChild, ElementRef, OnInit, Input } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../services/core.data.service';
import { SectorElement } from '../../../services/collections/elements/sector.element';
import { RessourcesService } from '../../../services/ressources.service';
import { ModuleElement } from '../../../services/collections/elements/module.element';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'device-form',
  styleUrls: ['./device-form.component.scss'],
  templateUrl: './device-form.component.html',
})
export class DeviceFormComponent implements OnInit {

  public isMobile;
  public sectorElement: SectorElement;
  public subscription = [];
  public deviceForm;

  @Input() revealed: any;


  constructor(private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService,
    private formBuilder: FormBuilder) {
    this.isMobile = this.deviceService.isMobile();


  }

  ngOnInit(): void {
    this.deviceForm = this.formBuilder.group({
      // id: this.sectorElement.id,
      // name: this.sectorElement.name,
      // description: this.sectorElement.description,
      // schemeId: this.sectorElement.schemeId,
      // groupViewId: this.sectorElement.groupViewId,
      // schemeDetailId: this.sectorElement.schemeDetailId
    });
  }

  public onSubmit(sectorData: any) {
    // this.resourceService.updateSector(sectorData).subscribe((result) => {
    //   this.coreDataService.sectorCollection.reload([result]);
    // });
  }

  save() {
    this.revealed.visible = !this.revealed.visible;
  }

  cancel() {
    this.revealed.visible = !this.revealed.visible;
  }
}
