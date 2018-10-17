/// <reference path="rest-service.ts"/>

namespace Camel {

  export class RestServicesService {

    constructor(private jolokiaService: JVM.JolokiaService, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getRestServices(): ng.IPromise<RestService[]> {
      const objectName = getSelectionCamelRestRegistry(this.workspace);
      return this.jolokiaService.execute(objectName, 'listRestServices')
        .then(obj => {
          const restServices: RestService[] = [];
          // the JMX tabular data has 2 indexes so we need to dive 2 levels down to grab the data
          _.values(obj).forEach(prop => {
            _.values(prop).forEach(restService => {
              restServices.push({
                url: restService.url,
                method: _.upperCase(restService.method),
                consumes: restService.consumes,
                produces: restService.produces,
                routeId: restService.routeId
              });
            });
          });
          return restServices;
        });
    }
  }

}
