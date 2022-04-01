/// <reference path="health.ts"/>
/// <reference path="../common/endpoint-mbean.ts"/>

namespace SpringBoot {

  export class HealthService {

    constructor(private jolokiaService: JVM.JolokiaService, private humanizeService: Core.HumanizeService, private springBootService: SpringBootService) {
      'ngInject';
    }

    getHealth(): ng.IPromise<Health> {
      log.debug('Fetch health data');
      const mbean: EndpointMBean = this.springBootService.getEndpointMBean(['Health'], ['health'])
      return this.jolokiaService.execute(mbean.objectName, mbean.operation)
        .then(response => {
          const details = response.details ? response.details : response;
          const globalItem = this.getGlobalCard(response);
          const items = this.getDetailCards(details);
          return new Health(globalItem, items);
        });
    }

    private getGlobalCard(data): HealthCard {
      return {
        title: 'Overall status: ' + data.status,
        iconClass: this.getIconClass(data.status)
      };
    }

    private getDetailCards(data): HealthCard[] {
      return _.toPairs(data)
        .filter((pair: [string, unknown]) => _.isObject(pair[1]))
        .sort(this.sortByFirstValue)
        .map((pair: [string, object]) => ({
          title: this.humanizeService.toSentenceCase(pair[0]),
          iconClass: this.getIconClass(pair[1]['status']),
          info: this.buildInfo(pair[1])
        }));
    }

    private buildInfo(obj: object): string[] {
      return _.toPairs(obj)
        .sort(this.sortByFirstValue)
        .map(pair => {
          let result = null;
          if (_.isObject(pair[1])) {
            result = '<ul>' +
              '<span class="info-item-label">' + this.humanizeService.toSentenceCase(pair[0]) + '</span>' +
              '<li>' +
              this.buildInfo(pair[1]).join('') +
              '</li></ul>';
          } else {
            result = '<ul><li>' +
              '<span class="info-item-label">' + this.humanizeService.toSentenceCase(pair[0]) + ': </span>' +
              pair[1] +
              '</li></ul>';
          }
          return result;
        });
    }

    getIconClass(status: string) {
      switch (status) {
        case 'UP':
          return 'pficon pficon-ok';
        case 'DOWN':
          return 'pficon pficon-error-circle-o';
        case 'OUT_OF_SERVICE':
          return 'pficon pficon-warning-triangle-o';
        case 'UNKNOWN':
          return 'pficon pficon-help';
        default:
          return 'pficon pficon-info';
      }
    }

    private sortByFirstValue = (pairA: [string, any], pairB: [string, any]) => {
      var nameA = pairA[0].toLowerCase();
      var nameB = pairB[0].toLowerCase();
      if (nameA === 'status') {
        return -1;
      }
      if (nameB === 'status') {
        return 1;
      }
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    }
  }

}
