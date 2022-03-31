namespace SpringBoot {

  export class SpringBootService {

    constructor(private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getTabs(): Nav.HawtioTab[] {
      const tabs = [];
      if (this.hasEndpoint('Health')) {
        tabs.push(new Nav.HawtioTab('Health', '/spring-boot/health'));
      }
      if (this.hasEndpoint('Info')) {
        tabs.push(new Nav.HawtioTab('Info', '/spring-boot/info'));
      }
      if (this.hasEndpoint('Loggers')) {
        tabs.push(new Nav.HawtioTab('Loggers', '/spring-boot/loggers'));
      }
      if (this.hasEndpoint('Httptrace')) {
        tabs.push(new Nav.HawtioTab('Trace', '/spring-boot/trace'));
      }
      return tabs;
    }

    getEndpointMBean(endpoints: string[], operations: string[]): EndpointMBean {
      const mbeans = endpoints
        .map(endpoint => this.workspace.findMBeanWithProperties("org.springframework.boot", {type: 'Endpoint', name: endpoint}))
        .filter(endpoint => endpoint !== null);

      if (mbeans.length > 0) {
        const mbean = mbeans[0];
        const ops = operations.filter(operation => mbean.mbean.op[operation])

        if (ops.length > 0) {
          return {objectName: mbean.objectName, operation: ops[0]};
        }
      }

      return null;
    }

    isValid(): boolean {
      return this.getTabs().length > 0;
    }

    private hasEndpoint(name: string): boolean {
      return this.workspace.treeContainsDomainAndProperties('org.springframework.boot',
        {type: 'Endpoint', name: name});
    }
  }
}
