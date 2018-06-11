/// <reference path="camel-navigation.service.ts"/>

namespace Camel {

  export class CamelNavigationController {
    tabs: Nav.HawtioTab[];

    constructor($scope: ng.IScope, private $location: ng.ILocationService, private camelNavigationService: CamelNavigationService,  private workspace: Jmx.Workspace) {
      'ngInject';
      $scope.$on('jmxTreeClicked', () => {
        this.tabs = camelNavigationService.getTabs();
      });
    }

    $onInit() {
      this.tabs = this.camelNavigationService.getTabs();
    }

    goto(tab: Nav.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const camelNavigationComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>',
    controller: CamelNavigationController
  };

}
