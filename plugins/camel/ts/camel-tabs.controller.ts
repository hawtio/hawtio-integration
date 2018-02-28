/// <reference path="camelPlugin.ts"/>

namespace Camel {

  export function CamelTabsController($scope: ng.IScope, $location: ng.ILocationService,
    camelTabsService: CamelTabsService) {
    'ngInject';

    this.tabs = camelTabsService.getTabs();

    $scope.$on('jmxTreeClicked', () => {
      this.tabs = camelTabsService.getTabs();
    });

    this.goto = (tab: Nav.HawtioTab) => {
      $location.path(tab.path);
    }
  }

  _module.controller('CamelTabsController', CamelTabsController);

}
