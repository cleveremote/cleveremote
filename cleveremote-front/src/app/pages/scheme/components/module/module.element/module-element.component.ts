import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModuleType, SourceType } from '../../../../../services/collections/elements/interfaces/module.interfaces';
import { ModuleElement } from '../../../../../services/collections/elements/module.element';
import { RessourcesService } from '../../../../../services/ressources.service';
import { CoreDataService } from '../../../../../services/core.data.service';

@Component({
  selector: 'module-element',
  styleUrls: ['./module-element.component.scss'],
  templateUrl: './module-element.component.html',
})
export class ModuleElementComponent {
  public moduleType = ModuleType;
  public sourceType = SourceType;

  @Input() source: SourceType;
  @Input() module: ModuleElement;
  @Output() onChecked = new EventEmitter();
  @Output() onDeleteModule = new EventEmitter();


  constructor(
    private resourceService: RessourcesService,
    private coreDataService: CoreDataService) {
  }

  public FieldsChange(module: any, values: any) {
    const response = { module: module, checked: values.target.checked };
    this.onChecked.emit(response as any);
  }

  public deleteFromGroup() {
    this.onDeleteModule.emit(this.module);
  }

  public execute(event: any) {
    this.module.value = (this.module.value === 'ON' ? 'OFF' : 'ON');
    this.resourceService.execute(this.module)
      .subscribe((result) => {
        this.coreDataService.valueCollection.reload();
      });
  }
}
