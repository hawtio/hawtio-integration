namespace Camel {

  export class EndpointsStatisticsService {

    constructor(
      private $q: ng.IQService,
      private jolokiaService: JVM.JolokiaService,
      private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getStatistics(): ng.IPromise<any[]> {
      var mbean = getSelectionCamelEndpointRuntimeRegistry(this.workspace);
      return this.jolokiaService.execute(mbean, 'endpointStatistics')
        .then(response => _.values(response));
    }    

  }

}
