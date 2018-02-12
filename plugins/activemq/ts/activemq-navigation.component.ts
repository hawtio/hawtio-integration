/// <reference path="activemqPlugin.ts"/>
/// <reference path="activemq-navigation.service.ts"/>

namespace ActiveMQ {

  export class ActiveMQNavigationController {
    
    tabs: Core.HawtioTab[];

    constructor($scope: ng.IScope, private $location: ng.ILocationService,
      private activeMQNavigationService: ActiveMQNavigationService) {
      'ngInject';
      
      $scope.$on('jmxTreeClicked', () => {
        this.tabs = activeMQNavigationService.getTabs();
      });
    }
    
    $onInit() {
      this.tabs = this.activeMQNavigationService.getTabs();
    }

    goto(tab: Core.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const activeMQNavigationComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>',
    controller: ActiveMQNavigationController
  };

  _module.component('activemqNavigation', activeMQNavigationComponent);

}
