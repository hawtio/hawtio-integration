/// <reference path="info.ts"/>
/// <reference path="../common/endpoint-mbean.ts"/>

namespace SpringBoot {

  export class InfoService {

    constructor(private jolokiaService: JVM.JolokiaService, private springBootService: SpringBootService) {
      'ngInject';
    }

    getInfo(): ng.IPromise<Info> {
      log.debug('Fetch info data');
      const mbean = this.springBootService.getEndpointMBean(['Info'], ['info']);
      return this.jolokiaService.execute(mbean.objectName, mbean.operation)
        .then(response => new Info(response));
    }
  }

}
