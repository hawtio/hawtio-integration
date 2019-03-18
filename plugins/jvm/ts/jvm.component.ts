namespace JVM {

  export class JvmController {
    tabs: Nav.HawtioTab[];

    constructor(workspace: Jmx.Workspace) {
      'ngInject';
      this.tabs = [new Nav.HawtioTab('Remote', '/jvm/connect')];
      if (hasLocalMBean(workspace)) {
        this.tabs.push(new Nav.HawtioTab('Local', '/jvm/local'));
      }
      if (hasDiscoveryMBean(workspace)) {
        this.tabs.push(new Nav.HawtioTab('Discover', '/jvm/discover'));
      }
    }
  }

  export const jvmComponent: angular.IComponentOptions = {
    template: '<hawtio-tabs-layout tabs="$ctrl.tabs"></hawtio-tabs-layout>',
    controller: JvmController
  };

}
