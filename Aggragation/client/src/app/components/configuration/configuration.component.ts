import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiRequestsService } from '../../services/api-requests.service';

@Component({
  selector: 'app-configuration-component',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {
  @Output() fromChildData: EventEmitter<any> = new EventEmitter();
  public data: string;
  constructor(private apiRequestsService: ApiRequestsService) {
  }

  ngOnInit() {
    const t = 2;
  }

  search(data) {
    // emit data to parent component
    this.fromChildData.emit({ TITI: 'TEST DATA ConfigurationComponent' });
  }
}
