namespace Jmx {

  export class NavigationController {
    tabs: Nav.HawtioTab[];

    constructor($scope: ng.IScope, private $location: ng.ILocationService, private workspace: Jmx.Workspace) {
      'ngInject';
      $scope.$on('jmxTreeClicked', () => {
        this.tabs = this.getTabs();
      });
    }

    $onInit() {
      this.tabs = this.getTabs();
    }
    
    private getTabs(): Nav.HawtioTab[] {
      const tabs = [];
      tabs.push(new Nav.HawtioTab('Attributes', '/jmx/attributes'));
      if (this.workspace.getSelectedMBeanName() !== null) {
        tabs.push(new Nav.HawtioTab('Operations', '/jmx/operations'));
      }
      tabs.push(new Nav.HawtioTab('Chart', '/jmx/charts'));
      return tabs;
    }

    goto(tab: Nav.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const navigationComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>',
    controller: NavigationController
  };

}
