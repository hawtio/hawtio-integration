/// <reference path="camelPlugin.ts"/>
/// <reference path="camel-navigation.service.ts"/>

namespace Camel {

  export class CamelNavigationController {

    private tabs: Nav.HawtioTab[];

    constructor(private $scope: ng.IScope, private $location: ng.ILocationService, private camelNavigationService: CamelNavigationService,  private workspace: Jmx.Workspace) {
      'ngInject';

      $scope.$on('jmxTreeClicked', (foo, bar:Jmx.Folder) => {
        this.tabs = camelNavigationService.getTabs();
        let tab = _.find(this.tabs, {path: this.$location.path()});
        if (!tab) {
          tab = this.tabs[0];
        }
        this.$location.path(tab.path);
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

  _module.component('camelNavigation', camelNavigationComponent);
}
