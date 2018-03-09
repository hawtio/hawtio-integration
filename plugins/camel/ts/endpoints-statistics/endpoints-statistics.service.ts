namespace Camel {

  export class EndpointsStatisticsService {

    constructor(private jolokiaService: JVM.JolokiaService, private treeService: Jmx.TreeService) {
      'ngInject';
    }

    getStatistics(): ng.IPromise<any[]> {
      return this.treeService.findMBeanWithProperties('org.apache.camel', {type: 'services', name: 'DefaultRuntimeEndpointRegistry'})
        .then(mbean => this.jolokiaService.execute(mbean.objectName, 'endpointStatistics')
          .then(response => _.values(response))
        );
    }
  }

}
