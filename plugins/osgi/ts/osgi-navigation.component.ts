/// <reference path="../../karaf/ts/karafHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export class OsgiNavigationController {
    
    tabs: Nav.HawtioTab[] = [];

    constructor(private $location: ng.ILocationService, private workspace: Jmx.Workspace) {
      'ngInject';
    }
    
    $onInit() {
      this.tabs.push(new Nav.HawtioTab('Bundles', '/osgi/bundles'));
      
      if (Karaf.getSelectionFeaturesMBean(this.workspace)) {
        this.tabs.push(new Nav.HawtioTab('Features', '/osgi/features'));
      }
      
      this.tabs.push(new Nav.HawtioTab('Packages', '/osgi/packages'));
      this.tabs.push(new Nav.HawtioTab('Services', '/osgi/services'));
      
      if (Karaf.getSelectionScrMBean(this.workspace)) {
        this.tabs.push(new Nav.HawtioTab('Declarative Services', '/osgi/scr-components'));
      }
      
      this.tabs.push(new Nav.HawtioTab('Server', '/osgi/server'));
      this.tabs.push(new Nav.HawtioTab('Framework', '/osgi/fwk'));
      this.tabs.push(new Nav.HawtioTab('Configuration', '/osgi/configurations'));
    }

    goto(tab: Nav.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const osgiNavigationComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>',
    controller: OsgiNavigationController
  };

  _module.component('osgiNavigation', osgiNavigationComponent);

}
