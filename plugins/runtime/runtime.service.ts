namespace Runtime {

  export class RuntimeService {

    constructor(private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getTabs(): Nav.HawtioTab[] {
      const tabs = [
        new Nav.HawtioTab('System Properties', '/runtime/sysprops'),
        new Nav.HawtioTab('Metrics', '/runtime/metrics')
      ];
      if (this.workspace.treeContainsDomainAndProperties('java.lang', { type: 'Threading' })) {
        tabs.push(new Nav.HawtioTab('Threads', '/runtime/threads'));
      }
      return tabs;
    }
  }

}
