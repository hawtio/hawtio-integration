/// <reference path="activemqPlugin.ts"/>
/// <reference path="activemq-navigation.service.ts"/>

namespace ActiveMQ {

  export class ActiveMQNavigationController {

    tabs: Nav.HawtioTab[];

    constructor($scope: ng.IScope, private $location: ng.ILocationService,
      private activeMQNavigationService: ActiveMQNavigationService) {
      'ngInject';

      $scope.$on('jmxTreeClicked', () => {
        this.tabs = activeMQNavigationService.getTabs();
        let tab = _.find(this.tabs, {path: this.$location.path()});
        if (!tab) {
          tab = this.tabs[0];
        }
        this.$location.path(tab.path);
      });
    }

    $onInit() {
      this.tabs = this.activeMQNavigationService.getTabs();
    }

    goto(tab: Nav.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const activeMQNavigationComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>',
    controller: ActiveMQNavigationController
  };

  _module.component('activemqNavigation', activeMQNavigationComponent);

}
