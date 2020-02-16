import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiRequestsService } from '../../services/api-requests.service';
import { DataService, Message } from '../../services/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scheme-component',
  templateUrl: './scheme.component.html',
  styleUrls: ['./scheme.component.css']
})
export class SchemeComponent implements OnInit {
  @Output() fromChildData: EventEmitter<any> = new EventEmitter();
  public data: string;
  public sub: Subscription;
  public entries: Array<string> = [];
  constructor(private apiRequestsService: ApiRequestsService,
    private dataService: DataService) {
  }

  ngOnInit() {
    this.sub = this.dataService.observable.subscribe((x) => {
      this.entries.push(x.content);
    });
  }

  search(data) {
    // emit data to parent component
    this.fromChildData.emit({ TITI: 'TEST data SchemeComponent' });
  }

  moduleExecution(jsonBody): void {
    //this.apiRequestsService.postExecution({ test: "testdata", idModule: "1234" }).subscribe();
    const toto = JSON.stringify(new Message('sender', 'content', false));
    this.dataService.socket.next(JSON.stringify({ op: 'hello' }));
  }

    ngOnDestroy() {
      this.sub.unsubscribe();
    }
  }
