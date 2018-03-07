/// <reference path="spring-boot.service.ts"/>

namespace SpringBoot {

  export class SpringBootController {
    tabs: Nav.HawtioTab[];

    constructor(private $location: ng.ILocationService, private springBootService: SpringBootService) {
      'ngInject';
    }

    $onInit() {
      this.springBootService.getTabs()
        .then(tabs => this.tabs = tabs);
    }

    goto(tab: Nav.HawtioTab) {
      this.$location.path(tab.path);
    }
  }

  export const springBootComponent: angular.IComponentOptions = {
    template: `
      <div class="nav-tabs-main">
        <hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>
        <div class="contents" ng-view></div>
      </div>
    `,
    controller: SpringBootController
  };

}
