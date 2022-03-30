/// <reference path="info.ts"/>
/// <reference path="../common/endpoint-mbean.ts"/>

namespace SpringBoot {
  const FlattenJSON = (obj = {}, res = {}, extraKey = '') => {
    for (key in obj) {
      if (typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
      } else {
        FlattenJSON(obj[key], res, `${extraKey}${key}.`);
      };
    };
    return res;
  };

  export class InfoService {

    constructor(private jolokiaService: JVM.JolokiaService, private springBootService: SpringBootService) {
      'ngInject';
    }

    getInfo(): ng.IPromise<Info> {
      log.debug('Fetch Info data');
      const mbean: EndpointMBean = this.springBootService.getEndpointMBean(['Info'], ['info'])
      return this.jolokiaService.execute(mbean.objectName, mbean.operation).then(
        response => {
          return new Info(Object.entries(FlattenJSON(JSON.parse(JSON.stringify(response)))));
        });

    }
  }

}
