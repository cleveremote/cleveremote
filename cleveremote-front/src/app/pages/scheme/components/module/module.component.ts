import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeWhile } from 'rxjs/operators';
import { NbDialogRef } from '@nebular/theme';

import { ModuleType, IModuleElement, SourceType } from './interfaces/module.interfaces';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../../services/core.data.service';

@Component({
  selector: 'module',
  styleUrls: ['./module.component.scss'],
  templateUrl: './module.component.html',
})
export class ModuleComponent implements OnInit {

  public revealed = false;
  public modules: Array<IModuleElement> = [];
  public modulesAll: Array<IModuleElement> = [];
  public groupChanges = [];
  public isMobile;
  constructor(private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService) {
    this.isMobile = this.deviceService.isMobile();
  }

  ngOnInit() {

    //get group information =>  https://github.com/silentmatt/expr-eval/tree/master
    const dataJson = `{
      "group": {
          "groupId": "server_1",
          "name": "name_name1",
          "description": "description"
      },
      "modules": [
          {   "moduleId" : "module1",
              "name": "module1",
              "type": 0,
              "configuration": {
                  "data": "comming soon"
              },
              "value": "ON"
          },
          { "moduleId" : "module2",
              "name": "module2",
              "type": 0,
              "configuration": {
                  "data": "comming soon"
              },
              "value": "ON"
          },
          { "moduleId" : "module3",
            "name": "module3",
            "type": 1,
            "configuration": {
                "data": "comming soon"
            },
            "value": "26°"
        }
      ]
  }`;

    const allModulesjson = `[
    {"moduleId" : "module1",
        "name": "module1",
        "type": 0,
        "configuration": {
            "data": "comming soon"
        },
        "value": "ON"
    },
    {"moduleId" : "module2",
        "name": "module2",
        "type": 0,
        "configuration": {
            "data": "comming soon"
        },
        "value": "ON"
    },
    {"moduleId" : "module3",
      "name": "module3",
      "type": 1,
      "configuration": {
          "data": "comming soon"
      },
      "value": "26°"
  },
   {"moduleId" : "module4",
    "name": "module4",
    "type": 0,
    "configuration": {
        "data": "comming soon"
    },
    "value": "OFF"
   },
   {"moduleId" : "module5",
    "name": "module5",
    "type": 0,
    "configuration": {
        "data": "comming soon"
    },
    "value": "OFF"
   },
   {"moduleId" : "module6",
   "name": "module6",
   "type": 0,
   "configuration": {
       "data": "comming soon"
   },
   "value": "OFF"
  },
  {"moduleId" : "module7",
  "name": "module7",
  "type": 0,
  "configuration": {
      "data": "comming soon"
  },
  "value": "OFF"
 },
 {"moduleId" : "module8",
 "name": "module5",
 "type": 0,
 "configuration": {
     "data": "comming soon"
 },
 "value": "OFF"
}, {"moduleId" : "module9",
"name": "module9",
"type": 0,
"configuration": {
    "data": "comming soon"
},
"value": "OFF"
},
{"moduleId" : "module9",
"name": "module9",
"type": 0,
"configuration": {
    "data": "comming soon"
},
"value": "OFF"
},
{"moduleId" : "module19",
"name": "module19",
"type": 0,
"configuration": {
    "data": "comming soon"
},
"value": "OFF"
},
{"moduleId" : "module29",
"name": "module29",
"type": 0,
"configuration": {
    "data": "comming soon"
},
"value": "OFF"
},
{"moduleId" : "module39",
"name": "module39",
"type": 0,
"configuration": {
    "data": "comming soon"
},
"value": "OFF"
}
]`;

    // const data = JSON.parse(dataJson);
    // const dataAll = JSON.parse(allModulesjson);
    ;
    this.coreDataService.devices[0].groupViews[0].modules.forEach(entry => {
      const module = entry;

      const moduleElement: any = {
        moduleId: module.moduleId,
        name: module.name,
        type: module.type,
        config: module.configuration,
        value: module.value,
      };
      this.modules.push(moduleElement);

    });

    this.coreDataService.modules.forEach(element => {
      if (this.modules.find((m) => m.name === element.name)) {
        element.checked = true;
        this.groupChanges.push(element);
      } else {
        element.checked = false;
      }
      this.modulesAll.push(element);
    });



    // setInterval(() => {
    //   this.modulesAll[0].value = Math.floor(Math.random() * 30).toString();
    // }, 3000);
  }

  toggleView() {

    this.revealed = !this.revealed;
    this.saveGroupes();
  }

  public saveGroupes() {
    const t = this.groupChanges;
    this.groupChanges.forEach(element => {
      if (element.checked) {
        if (!this.modules.find((x: any) => x.moduleId === element.moduleId)) {
          this.modules.push(element);
        }

      } else {
        const i = this.modules.findIndex((x: any) => x.moduleId === element.moduleId);
        if (i !== -1) {
          this.modules.splice(i);
        }
      }
    });
    this.groupChanges = this.groupChanges.filter((x) => x.checked);
  }
}
