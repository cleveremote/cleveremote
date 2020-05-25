import { Component, ViewChild, ElementRef, OnInit, Input, AfterViewChecked } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../../../services/core.data.service';
import { SectorElement } from '../../../../../services/collections/elements/sector.element';
import { RessourcesService } from '../../../../../services/ressources.service';
import { ModuleElement } from '../../../../../services/collections/elements/module.element';
import { FormBuilder, FormGroup, Validators, FormControl, ValidatorFn } from '@angular/forms';
import { TransceiverElement } from '../../../../../services/collections/elements/transceiver.element';
import { NbIconLibraries } from '@nebular/theme';
import { TYPE_IOCFG, TYPE_IO, TRANSCIEVER_TYPE, TRANSCIEVER_TYPE_LABEL, TRANSCIEVER_STATUS, TRANSCIEVER_STATUS_LABEL, TYPE_IOCFG_LABEL, TYPE_IO_LABEL } from '../../../../../services/collections/elements/interfaces/transceiver.interfaces';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff';
import { v1 } from 'uuid';

@Component({
  selector: 'transceiver-form',
  styleUrls: ['./transceiver-form.component.scss'],
  templateUrl: './transceiver-form.component.html',
})
export class TransceiverFormComponent implements OnInit { //, AfterViewChecked

  public isMobile;
  public subscription = [];
  public deviceForm;
  public previousState = false;


  //Combo
  public typeLst = [];
  public iocfgLst = [];
  public portCfg = [];

  public portConfiguration = ['D1', 'D2', 'D3', 'D4', 'P1', 'P2'];
  public analogConfiguration = ['D1', 'D2', 'D3'];
  public loaded = false;
  public previousFormData: any;
  @Input() data: any;

  public isCoordinator = false;


  constructor(
    private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService,
    private formBuilder: FormBuilder,
    iconsLibrary: NbIconLibraries
  ) {
    this.isMobile = this.deviceService.isMobile();
    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
  }

  ngOnInit(): void {
    this.initLisValues();
    this.reload(this.data.element);
  }

  public reload(element: TransceiverElement) {
    if (element) {
      this.isCoordinator = element.type === TRANSCIEVER_TYPE.COORDINATOR ? true : false;
      this.deviceForm = this.formBuilder.group({
        id: element.id,
        name: [element.name, [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
        address: element.address,
        description: [element.description, [Validators.maxLength(255)]],
        deviceId: element.deviceId,
        type: element.type,
        typeIOCfg: this.getConfigurationType(element.configuration.IOCfg),
        SN: [element.configuration.sleepCfg && element.configuration.sleepCfg.SN, [Validators.required, Validators.min(1), Validators.max(65535)]],
        SP: [element.configuration.sleepCfg && element.configuration.sleepCfg.SP, [Validators.required, Validators.min(320), Validators.max(2800)]],
        ST: [element.configuration.sleepCfg && element.configuration.sleepCfg.ST],
        IR: [element.configuration.sleepCfg && element.configuration.sleepCfg.IR],
        IC: [element.configuration.sleepCfg && element.configuration.sleepCfg.IC],
        extended: (element.configuration.sleepCfg && element.configuration.sleepCfg.SN) * (element.configuration.sleepCfg && element.configuration.sleepCfg.SP) * 10
      });
      this.setIOCfg(element.configuration.IOCfg);
      this.filterType(element.type);
      this.transceiverTypeChange(element.type);
      this.loaded = true;
    }
    this.previousFormData = JSON.parse(JSON.stringify(this.deviceForm.value));
  }

  public filterType(type) {
    switch (type) {
      case TRANSCIEVER_TYPE.ROUTER:
        this.typeLst = this.typeLst.filter(_ => _.value !== TRANSCIEVER_TYPE.COORDINATOR);
        this.iocfgLst = [];
        for (const iocfg in TYPE_IOCFG) {
          if (isNaN(Number(iocfg))) {
            this.iocfgLst.push({ label: TYPE_IOCFG_LABEL[iocfg], value: TYPE_IOCFG[iocfg] });
          }
        }
        break;
      case TRANSCIEVER_TYPE.ENDDEVICE:
        this.typeLst = this.typeLst.filter(_ => _.value !== TRANSCIEVER_TYPE.COORDINATOR);
        this.iocfgLst = this.iocfgLst.filter(_ => [TYPE_IOCFG.CUSTOM, TYPE_IOCFG.FULL_ANALOG_INPUT, TYPE_IOCFG.FULL_DIGITAL_INPUT].indexOf(_.value) !== -1);
        break;

      default:
        break;
    }
  }

  public getConfigurationType(ioCfg: any) {
    let isCustom = false;
    for (const prop in ioCfg) {
      if (ioCfg.hasOwnProperty(prop)) {
        if (ioCfg['D1'][0] !== ioCfg[prop][0]) {
          isCustom = true;
          break;
        }
      }
    }
    if (isCustom) {
      return TYPE_IOCFG.CUSTOM;
    }
    switch (ioCfg['D1'][0]) {
      case 3:
        return TYPE_IOCFG.FULL_DIGITAL_INPUT;
      case 2:
        return TYPE_IOCFG.FULL_ANALOG_INPUT;
      case 4:
        return TYPE_IOCFG.FULL_DIGITAL_OUTPUT_LOW;
      case 5:
        return TYPE_IOCFG.FULL_DIGITAL_OUTPUT_HIGH;
    }

  }

  public onSubmit() {

    const previousData = this.buildDataToSave(this.previousFormData);
    const currentData = this.buildDataToSave(this.deviceForm.value);

    const sleepCfgDifferences: any = detailedDiff(previousData.configuration.sleepCfg, currentData.configuration.sleepCfg);
    const IOCfgDifferences: any = detailedDiff(previousData.configuration.IOCfg, currentData.configuration.IOCfg);
    if (Object.keys(sleepCfgDifferences.updated).length > 0 || Object.keys(IOCfgDifferences.updated).length > 0) {
      // new transceiver with pending status
      currentData.id = v1();
      currentData.status = TRANSCIEVER_STATUS.PENDING;
      previousData.pending = currentData;
      const transceiver = this.coreDataService.transceiverCollection.elements.find(_ => _.id === previousData.id);

      this.resourceService.saveTransceiver(previousData).subscribe((result) => {
        transceiver.pending = currentData;
        this.reload(result);
      });
    } else {
      this.resourceService.saveTransceiver(currentData).subscribe((result) => {
        this.reload(result);
      });
    }

  }

  public buildDataToSave(formValues: any) {
    const dto = {} as any;
    const IOCfg = {};
    const sleepCfg = {};
    this.portConfiguration.forEach(io => {
      IOCfg[io] = [formValues[io]];
    });
    IOCfg['V+'] = formValues['V+'];
    sleepCfg['SM'] = formValues.type === TRANSCIEVER_TYPE.ENDDEVICE ? 5 : 0;
    sleepCfg['SN'] = formValues.SN;
    sleepCfg['SP'] = formValues.SP;
    sleepCfg['ST'] = formValues.ST;
    sleepCfg['IC'] = formValues.IC;
    sleepCfg['IR'] = formValues.IR;

    dto.id = formValues.id;
    dto.name = formValues.name;
    dto.description = formValues.description;
    dto.address = formValues.address;
    dto.type = formValues.type;
    dto.deviceId = formValues.deviceId;
    dto.status = formValues.status;
    dto.updatedAt = new Date();
    dto.configuration = { sleepCfg: sleepCfg, IOCfg: IOCfg };
    return dto;
  }

  public setIOCfg(ioCfg: any) {
    const controls = {};
    for (const prop in ioCfg) {
      if (ioCfg.hasOwnProperty(prop)) {
        const controlName = `${prop}`;
        if(prop==='V+'){
          this.deviceForm.addControl(prop, this.formBuilder.control(ioCfg[prop]));
        } else {
          this.deviceForm.addControl(prop, this.formBuilder.control(ioCfg[prop][0]));
        }
        
      }
    }
  }

  public convertFromBytesToDecimal(value: Array<any>): number {
    return 123;
  }

  public convertFromDecimaToBytes(): Array<any> {
    return [];
  }

  public initLisValues() {
    const t = TRANSCIEVER_TYPE;
    for (const type in TRANSCIEVER_TYPE) {
      if (isNaN(Number(type))) {
        this.typeLst.push({ label: TRANSCIEVER_TYPE_LABEL[type], value: TRANSCIEVER_TYPE[type] });
      }
    }
    for (const iocfg in TYPE_IOCFG) {
      if (isNaN(Number(iocfg))) {
        this.iocfgLst.push({ label: TYPE_IOCFG_LABEL[iocfg], value: TYPE_IOCFG[iocfg] });
      }
    }

    for (const typeio in TYPE_IO) {
      if (isNaN(Number(typeio))) {
        this.portCfg.push({ label: TYPE_IO_LABEL[typeio], value: TYPE_IO[typeio] });
      }
    }

  }
  public sleepCfgDisabled = true;
  public transceiverTypeChange(event) {
    switch (event) {
      case TRANSCIEVER_TYPE.COORDINATOR:
      case TRANSCIEVER_TYPE.ROUTER:
        this.sleepCfgDisabled = true;
        this.iOCfgChange(this.deviceForm.controls['typeIOCfg'].value);
        break;
      case TRANSCIEVER_TYPE.ENDDEVICE:
        this.sleepCfgDisabled = false;
        const typeIOCfg = [TYPE_IOCFG.FULL_ANALOG_INPUT, TYPE_IOCFG.FULL_DIGITAL_INPUT, TYPE_IOCFG.CUSTOM].indexOf(this.deviceForm.controls['typeIOCfg'].value) !== -1 ? this.deviceForm.controls['typeIOCfg'].value : TYPE_IOCFG.FULL_DIGITAL_INPUT;
        this.deviceForm.controls['typeIOCfg'].patchValue(typeIOCfg);
        this.iOCfgChange(typeIOCfg);
        break;
    }
    this.filterType(event);
  }

  public cfgportDisable = false;
  public iOCfgChange(event) {
    const t = TYPE_IOCFG.FULL_DIGITAL_INPUT === event;
    switch (event) {
      case TYPE_IOCFG.FULL_DIGITAL_INPUT:
        this.cfgportDisable = true;
        this.portConfiguration.forEach(port => {
          this.deviceForm.controls[port].patchValue(TYPE_IO.DIGITAL_INPUT);
        });

        break;
      case TYPE_IOCFG.FULL_ANALOG_INPUT:
        this.cfgportDisable = true;

        this.portConfiguration.forEach(port => {
          if (this.analogConfiguration.indexOf(port) === -1) {
            this.deviceForm.controls[port].patchValue(TYPE_IO.DISABLED);
          } else {
            this.deviceForm.controls[port].patchValue(TYPE_IO.ANALOG_INPUT);
          }
        });
        break;
      case TYPE_IOCFG.FULL_DIGITAL_OUTPUT_HIGH:
        this.cfgportDisable = true;
        this.portConfiguration.forEach(port => {
          this.deviceForm.controls[port].patchValue(TYPE_IO.DIGITAL_OUTPUT_HIGH);
        });
        break;
      case TYPE_IOCFG.FULL_DIGITAL_OUTPUT_LOW:
        this.cfgportDisable = true;
        this.portConfiguration.forEach(port => {
          this.deviceForm.controls[port].patchValue(TYPE_IO.DIGITAL_OUTPUT_LOW);
        });
        break;
      case TYPE_IOCFG.CUSTOM:
        const type = this.deviceForm.get('type').value;
        this.cfgportDisable = false;
        if (type === TRANSCIEVER_TYPE.ENDDEVICE) {
          this.portCfg = this.portCfg.filter(_ => [TYPE_IO.ANALOG_INPUT, TYPE_IO.DIGITAL_INPUT].indexOf(_.value) !== -1);
          this.portConfiguration.forEach(port => {
            this.deviceForm.controls[port].patchValue(TYPE_IO.DIGITAL_INPUT);
          });
        } else {
          this.portCfg = [];
          for (const typeio in TYPE_IO) {
            if (isNaN(Number(typeio))) {
              this.portCfg.push({ label: TYPE_IO_LABEL[typeio], value: TYPE_IO[typeio] });
            }
          }
        }
        break;
      default:
        break;
    }
  }

  public SPchange(event: any) {
    //if !isNaN(parseFloat(event.keyCode)) && isFinite(event.keyCode);
    const newValue = Number(event.target.value);
    const sn = Number(this.deviceForm.get('SN').value);
    const type = this.deviceForm.get('extended').patchValue(newValue * sn * 10);
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;

  }

  public SNchange(event) {
    const newValue = Number(event.target.value);
    const sp = Number(this.deviceForm.get('SP').value);
    const type = this.deviceForm.get('extended').patchValue(newValue * sp * 10);

  }

  public manageFormError(controlName) {
    return this.deviceForm.controls[controlName].invalid && (this.deviceForm.controls[controlName].dirty || this.deviceForm.controls[controlName].touched) ? 'danger' : '';
  }

  public errorMessage(controlName) {
    const errors = [];
    if (this.deviceForm.controls[controlName].invalid && (this.deviceForm.controls[controlName].dirty || this.deviceForm.controls[controlName].touched)) {
      if (this.deviceForm.controls['SP'].errors.required) {
        errors.push(`* ${controlName} is required.`);
      }
      if (this.deviceForm.controls['SP'].errors.minlength) {
        errors.push(`* ${controlName} must be at least 4 characters long.`);
      }
    }
  }

}
