/// <reference path="layout.service.ts"/>

namespace SpringBoot {

  export function SpringBootLayoutController($location: ng.ILocationService, springBootLayoutService: SpringBootLayoutService) {
    'ngInject';

    this.tabs = springBootLayoutService.getTabs();

    this.goto = tab => {
      $location.path(tab.path);
    };
  }
}
