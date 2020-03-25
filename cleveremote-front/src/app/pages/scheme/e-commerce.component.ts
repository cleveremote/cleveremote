import { Component } from '@angular/core';
import { CoreDataService } from '../../services/core.data.service';

@Component({
  selector: 'ngx-ecommerce',
  templateUrl: './e-commerce.component.html',
})
export class SchemeComponent {
  constructor(private coreDataService: CoreDataService){
    console.log('test');
  }
}
