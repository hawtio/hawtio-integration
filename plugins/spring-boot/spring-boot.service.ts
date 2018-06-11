namespace SpringBoot {

  export class SpringBootService {

    constructor(private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getTabs(): Nav.HawtioTab[] {
      const tabs = [];
      if (this.hasEndpoint('healthEndpoint')) {
        tabs.push(new Nav.HawtioTab('Health', '/spring-boot/health'));
      }
      if (this.hasEndpoint('loggersEndpoint')) {
        tabs.push(new Nav.HawtioTab('Loggers', '/spring-boot/loggers'));
      }
      if (this.hasEndpoint('traceEndpoint')) {
        tabs.push(new Nav.HawtioTab('Trace', '/spring-boot/trace'));
      }
      return tabs;
    }

    private hasEndpoint(name: string): boolean {
      return this.workspace.treeContainsDomainAndProperties('org.springframework.boot',
        {type: 'Endpoint', name: name});
    }

  }
}
