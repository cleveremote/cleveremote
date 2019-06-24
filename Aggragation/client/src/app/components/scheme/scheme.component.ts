import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiRequestsService } from '../../services/api-requests.service';

@Component({
  selector: 'app-scheme-component',
  templateUrl: './scheme.component.html',
  styleUrls: ['./scheme.component.css']
})
export class SchemeComponent implements OnInit {
  @Output() fromChildData: EventEmitter<any> = new EventEmitter();
  public data: string;
  constructor(private apiRequestsService: ApiRequestsService) {
  }

  ngOnInit() {

  }

  search(data) {
    // emit data to parent component
    this.fromChildData.emit({ TITI: 'TEST data SchemeComponent' });
  }
}
