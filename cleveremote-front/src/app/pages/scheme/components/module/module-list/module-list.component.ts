import { EventEmitter, Component, ViewChild, ElementRef, Input, OnInit, Output } from '@angular/core';
import { IModuleElement, SourceType } from '../../../../../services/collections/elements/interfaces/module.interfaces';
import { ModuleElement } from '../../../../../services/collections/elements/module.element';


@Component({
  selector: 'module-list',
  styleUrls: ['./module-list.component.scss'],
  templateUrl: './module-list.component.html',
})
export class ModuleListComponent implements OnInit {
  @Input() modules: Array<ModuleElement> = [];
  public sourceType = SourceType;
  @Output() onDeleteModule = new EventEmitter();

  ngOnInit() {
  }

  public deleteModule(module: ModuleElement) {
    this.onDeleteModule.emit(module);
  }

}
