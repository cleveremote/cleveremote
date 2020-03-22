import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModuleType, SourceType } from '../interfaces/module.interfaces';

@Component({
  selector: 'ngx-status-card1',
  styleUrls: ['./status-card.component.scss'],
  templateUrl: './module.element.component.html',
})
export class StatusCardComponent {
  public moduleType = ModuleType;
  public sourceType = SourceType;

  // @Input() title: string;
  // @Input() type: ModuleType;
  // @Input() on = true;
  // @Input() config: any;
  // @Input() source: SourceType;
  // @Input() value: string;
  @Input() source: SourceType;
  @Input() module: any;
  @Output() onChecked = new EventEmitter();

  public FieldsChange(module: any, values: any) {
    const response = { module: module, checked: values.target.checked };
    this.onChecked.emit(response as any);
  }
}
