import { Component } from '@angular/core';
import { CoreDataService } from '../../services/core.data.service';

@Component({
  selector: 'configuration-page',
  styleUrls: ['./configuration.component.scss'],
  templateUrl: './configuration.component.html',
})
export class ConfigurationComponent {
  public _revealed = {visible:false};
  constructor(private coreDataService: CoreDataService){
    console.log('test');
  }

  get revealed(){
    return this._revealed.visible;
  }
}
