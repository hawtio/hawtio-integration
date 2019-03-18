/// <reference path="runtime.service.ts"/>

namespace Runtime {

  export class RuntimeController {
    tabs: Nav.HawtioTab[];

    constructor(private runtimeService: RuntimeService) {
      'ngInject';
    }

    $onInit() {
      this.tabs = this.runtimeService.getTabs();
    }
  }

  export const runtimeComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs-layout tabs="$ctrl.tabs"></hawtio-tabs-layout>',
    controller: RuntimeController
  };

}
