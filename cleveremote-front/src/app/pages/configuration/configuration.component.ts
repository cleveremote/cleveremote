import { Component } from '@angular/core';
import { CoreDataService } from '../../services/core.data.service';

@Component({
  selector: 'configuration-page',
  templateUrl: './configuration.component.html',
})
export class ConfigurationComponent {
  constructor(private coreDataService: CoreDataService){
    console.log('test');
  }
}
