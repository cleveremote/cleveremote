import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiRequestsService } from '../../services/api-requests.service';
import { DataService } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-component',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
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
    this.fromChildData.emit({ TITI: 'TEST DATA DashboardComponent'  });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  
}
