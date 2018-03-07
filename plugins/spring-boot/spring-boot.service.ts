namespace SpringBoot {

  export class SpringBootService {

    constructor(private $q: ng.IQService, private treeService: Jmx.TreeService) {
      'ngInject';
    }

    getTabs(): ng.IPromise<Nav.HawtioTab[]> {
      return this.$q.all([
        this.hasEndpoint('healthEndpoint'),
        this.hasEndpoint('loggersEndpoint'),
        this.hasEndpoint('traceEndpoint')])
      .then(results => {
        const tabs = [];
        if (results[0]) {
          tabs.push(new Nav.HawtioTab('Health', '/spring-boot/health'));
        }
        if (results[1]) {
          tabs.push(new Nav.HawtioTab('Loggers', '/spring-boot/loggers'));
        }
        if (results[2]) {
          tabs.push(new Nav.HawtioTab('Trace', '/spring-boot/trace'));
        }
        return tabs;
      });
    }

    private hasEndpoint(name: string): ng.IPromise<boolean> {
      return this.treeService.treeContainsDomainAndProperties('org.springframework.boot',
        {type: 'Endpoint', name: name});
    }

  }
}
