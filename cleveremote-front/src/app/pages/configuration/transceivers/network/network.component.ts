import { Component, ViewChild, ElementRef, Input, OnInit } from '@angular/core';




@Component({
  selector: 'transcienver-network',
  styleUrls: ['./network.component.scss'],
  templateUrl: './network.component.html',
})
export class NetworkComponent implements OnInit {
 // @Input() modules: Array<IModuleElement> = [];
  // public sourceType = SourceType;
  @ViewChild("searchInput", { static: true }) private searchInput: ElementRef<HTMLElement>;

 ngOnInit(){
  this.searchInput.nativeElement.blur();
 }

  ngOnDestroy() {
  }

}
