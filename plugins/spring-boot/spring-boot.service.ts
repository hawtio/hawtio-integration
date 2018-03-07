namespace SpringBoot {

  export class SpringBootService {

    constructor(private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getTabs(): Nav.HawtioTab[] {
      let domain = 'org.springframework.boot';
      let type = 'Endpoint';
      let tabs = [];

      if (this.workspace.treeContainsDomainAndProperties(domain, { type: type, name: 'healthEndpoint' })) {
        tabs.push(new Nav.HawtioTab('Health', '/spring-boot/health'));
      }

      if (this.workspace.treeContainsDomainAndProperties(domain, { type: type, name: 'loggersEndpoint' })) {
        tabs.push(new Nav.HawtioTab('Loggers', '/spring-boot/loggers'));
      }

      if (this.workspace.treeContainsDomainAndProperties(domain, { type: type, name: 'traceEndpoint' })) {
        tabs.push(new Nav.HawtioTab('Trace', '/spring-boot/trace'));
      }

      return tabs;
    }
  }
}
