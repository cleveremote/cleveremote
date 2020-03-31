import { Component, Input } from '@angular/core';
import { SourceType } from '../../../../../services/collections/elements/interfaces/module.interfaces';

@Component({
  selector: 'module-list-all',
  styleUrls: ['./module-list-all.component.scss'],
  templateUrl: './module-list-all.component.html',
})
export class ModuleListAllComponent {
  @Input() modules: Array<any> = [];
  @Input() groupChanges: Array<any> = [];
  public sourceType = SourceType;

  public modifyGroup(event: any) {
    event.module.checked = !event.module.checked;
  }

}
