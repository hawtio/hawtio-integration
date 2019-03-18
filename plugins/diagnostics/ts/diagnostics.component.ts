/// <reference path="diagnostics.service.ts"/>

namespace Diagnostics {

  export class DiagnosticsController {
    tabs: Nav.HawtioTab[];

    constructor(private diagnosticsService: DiagnosticsService) {
      'ngInject';
    }

    $onInit() {
      this.tabs = this.diagnosticsService.getTabs();
    }
  }

  export const diagnosticsComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs-layout tabs="$ctrl.tabs"></hawtio-tabs-layout>',
    controller: DiagnosticsController
  };

}
