/// <reference path="health.ts"/>

namespace SpringBoot {

  export class HealthService {

    constructor(private jolokiaService: JVM.JolokiaService, private humanizeService: Core.HumanizeService) {
      'ngInject';
    }

    getHealth(): ng.IPromise<Health> {
      log.debug('Fetch health data');
      return this.jolokiaService.getAttribute('org.springframework.boot:type=Endpoint,name=healthEndpoint', 'Data')
        .then(data => {
          const status = this.toHealthStatus(data.status);
          const items = this.toItems(data);
          return new Health(status, items);
        });
    }

    private toHealthStatus(str): HealthStatus {
      return <HealthStatus> this.humanizeService.toUpperCase(str);
    }

    private toItems(data): HealthItem[] {
      return _.toPairs(data)
        .filter(pair => _.isObject(pair[1]))
        .map(pair => ({
          title: this.humanizeService.toSentenceCase(pair[0]),
          info: _.toPairs(pair[1]).map(pair => this.humanizeService.toSentenceCase(pair[0]) + ': ' + pair[1])
        }));
    }
    
  }

}