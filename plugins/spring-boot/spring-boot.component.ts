/// <reference path="spring-boot.service.ts"/>

namespace SpringBoot {

  export class SpringBootController {
    tabs: Nav.HawtioTab[];

    constructor(private springBootService: SpringBootService) {
      'ngInject';
    }

    $onInit() {
      this.tabs = this.springBootService.getTabs();
    }
  }

  export const springBootComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs-layout tabs="$ctrl.tabs"></hawtio-tabs-layout>',
    controller: SpringBootController
  };

}
