import { Component, ViewContainerRef, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { CoreDataService } from '../../services/core.data.service';
import { NetworkFormComponent } from './forms/network-form.component';

@Component({
  selector: 'configuration-page',
  styleUrls: ['./configuration.component.scss'],
  templateUrl: './configuration.component.html',
})
export class ConfigurationComponent {
  public _revealed = { visible: false };
  public _data = { element: undefined, type: undefined };
  @ViewChild('containerFormCmp', { read: ViewContainerRef, static: true }) private containerFormCmp: ViewContainerRef;
  public formContainer = this;
  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
  }

  get revealed() {
    return this._revealed.visible;
  }


  loadComponent() {
    const viewContainerRef = this.containerFormCmp;
    viewContainerRef.clear();

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(NetworkFormComponent);

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<NetworkFormComponent>componentRef.instance).data = this._data;
    (<NetworkFormComponent>componentRef.instance).revealed = this._revealed;
  }


}
