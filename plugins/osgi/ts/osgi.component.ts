namespace Osgi {

  export class OsgiController {
    
    tabs: Nav.HawtioTab[];

    constructor(private workspace: Jmx.Workspace) {
      'ngInject';
    }
    
    $onInit() {
      this.tabs = [];

      const bundlesTab = new Nav.HawtioTab('Bundles', '/osgi/bundles');
      this.tabs.push(bundlesTab);
      
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
  }

  export const osgiComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs-layout tabs="$ctrl.tabs"></hawtio-tabs-layout>',
    controller: OsgiController
  };

}
