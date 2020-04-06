import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../../services/core.data.service';
import { SectorElement } from '../../../../services/collections/elements/sector.element';
import { RessourcesService } from '../../../../services/ressources.service';
import { ModuleElement } from '../../../../services/collections/elements/module.element';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'sector-form',
  styleUrls: ['./sector-form.component.scss'],
  templateUrl: './sector-form.component.html',
})
export class SectorFormComponent implements OnInit {

  public isMobile;
  public sectorElement: SectorElement;
  public subscription = [];
  public sectorForm;


  constructor(private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService,
    private formBuilder: FormBuilder) {
    this.isMobile = this.deviceService.isMobile();


  }

  ngOnInit(): void {
    this.sectorForm = this.formBuilder.group({
      id: this.sectorElement.id,
      name: this.sectorElement.name,
      description: this.sectorElement.description,
      schemeId: this.sectorElement.schemeId,
      groupViewId: this.sectorElement.groupViewId,
      schemeDetailId: this.sectorElement.schemeDetailId
    });
  }

  public onSubmit(sectorData: any) {
    this.resourceService.updateSector(sectorData).subscribe((result) => {
      this.coreDataService.sectorCollection.reload([result]);
    });
  }
}
