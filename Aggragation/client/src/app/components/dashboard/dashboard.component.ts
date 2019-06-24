import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiRequestsService } from '../../services/api-requests.service';

@Component({
  selector: 'app-dashboard-component',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @Output() fromChildData: EventEmitter<any> = new EventEmitter();
  public data: string;
  constructor(private apiRequestsService: ApiRequestsService) {
  }

  ngOnInit() {
    const t = 2;
  }

  search(data) {
    // emit data to parent component
    this.fromChildData.emit({ TITI: 'TEST DATA DashboardComponent'  });
  }
  
}
