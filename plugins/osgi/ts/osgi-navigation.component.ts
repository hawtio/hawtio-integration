/// <reference path="../../karaf/ts/karafHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export class OsgiNavigationController {
    
    tabs: Nav.HawtioTab[];
    activeTab: Nav.HawtioTab;

    constructor(
      private $location: ng.ILocationService,
      private workspace: Jmx.Workspace,
      private treeService: Jmx.TreeService,
      private $scope: ng.IScope) {
      'ngInject';
    }
    
    $onInit() {
      this.treeService.runWhenTreeReady(() => {
        const tabs = [];

        const bundlesTab = new Nav.HawtioTab('Bundles', '/osgi/bundles');
        tabs.push(bundlesTab);
        
        if (Karaf.getSelectionFeaturesMBean(this.workspace)) {
          tabs.push(new Nav.HawtioTab('Features', '/osgi/features'));
        }
        
        tabs.push(new Nav.HawtioTab('Packages', '/osgi/packages'));
        tabs.push(new Nav.HawtioTab('Services', '/osgi/services'));
        
        if (Karaf.getSelectionScrMBean(this.workspace)) {
          tabs.push(new Nav.HawtioTab('Declarative Services', '/osgi/scr-components'));
        }
        
        tabs.push(new Nav.HawtioTab('Server', '/osgi/server'));
        tabs.push(new Nav.HawtioTab('Framework', '/osgi/fwk'));
        tabs.push(new Nav.HawtioTab('Configuration', '/osgi/configurations'));

        this.tabs = tabs;

        this.$scope.$on('$routeChangeSuccess', (event, current, previous) => {
          if (_.startsWith(this.$location.path(), '/osgi/bundle')) {
            this.activeTab = bundlesTab;
          } else {
            this.activeTab = null;
          }
        });
      });
    }

    goto(tab: Nav.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const osgiNavigationComponent: angular.IComponentOptions = {
    template: `
      <hawtio-tabs tabs="$ctrl.tabs"
        active-tab="$ctrl.activeTab"
        on-change="$ctrl.goto(tab)">
      </hawtio-tabs>`,
    controller: OsgiNavigationController
  };

  _module.component('osgiNavigation', osgiNavigationComponent);

}
