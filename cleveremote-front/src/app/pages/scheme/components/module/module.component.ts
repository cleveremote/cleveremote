import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../../services/core.data.service';
import { SectorElement } from '../../../../services/collections/elements/sector.element';
import { RessourcesService } from '../../../../services/ressources.service';
import { ModuleElement } from '../../../../services/collections/elements/module.element';

@Component({
  selector: 'module',
  styleUrls: ['./module.component.scss'],
  templateUrl: './module.component.html',
})
export class ModuleComponent implements OnInit {

  public revealed = false;
  public groupChanges = [];
  public isMobile;
  public sectorElement: SectorElement;
  @ViewChild('searchInput', { static: true }) private searchInput: ElementRef<HTMLElement>;
  @ViewChild('testFocus', { static: true }) private testFocus: ElementRef<HTMLElement>;


  public subscription = [];


  constructor(private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService) {
    this.isMobile = this.deviceService.isMobile();
  }

  ngOnInit(): void {
    this.searchInput.nativeElement.blur();
  }

  get modules() {
    return this.coreDataService.groupViewCollection.getGroupViewById(this.sectorElement.groupViewId).modules;
  }

  set modules(modules: Array<ModuleElement>) {
    this.coreDataService.groupViewCollection.getGroupViewById(this.sectorElement.groupViewId).modules = modules;
  }

  get modulesAll() {
    return this.coreDataService.moduleCollection.exludeModules(this.coreDataService.currentDevice.id, this.coreDataService.groupViewCollection.getGroupViewById(this.sectorElement.groupViewId).modules);
  }

  toggleView() {
    this.revealed = !this.revealed;
    this.saveGroupes();
  }

  public saveGroupes() {
    const modulesToAdd = this.modulesAll.filter((module) => (module as any).checked);
    if (modulesToAdd.length > 0) {
      const moduleIds = modulesToAdd.map((x) => x.id);
      this.resourceService.addModulesToGroup(moduleIds, this.sectorElement.groupViewId)
        .pipe(tap((result) => {
          this.modules = this.modules.concat(modulesToAdd);
          this.modules.forEach((module) => (module as any).checked = false);
        })).subscribe();
    }
  }

  public deleteModule(module: ModuleElement) {
    this.resourceService.deleteModulesFromGroup([module.id], this.sectorElement.groupViewId)
      .pipe(tap(() => {
        const index = this.modules.findIndex((x) => x.id === module.id);
        this.modules.splice(index, 1);
      })).subscribe();

  }
}
