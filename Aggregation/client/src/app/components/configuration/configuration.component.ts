import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiRequestsService } from '../../services/api-requests.service';
import { DataService } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-configuration-component',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {
  @Output() fromChildData: EventEmitter<any> = new EventEmitter();
  public data: string;
  public sub: Subscription;
  
  constructor(private apiRequestsService: ApiRequestsService,
    private dataService: DataService) {
  }

  ngOnInit() {
    this.sub = this.dataService.observable.subscribe((x) => {
      const t = x;
    });
  }

  search(data) {
    // emit data to parent component
    this.fromChildData.emit({ TITI: 'TEST DATA ConfigurationComponent' });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
