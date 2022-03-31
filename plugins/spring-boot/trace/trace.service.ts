/// <reference path="trace.ts"/>
/// <reference path="../common/endpoint-mbean.ts"/>

namespace SpringBoot {

  export class TraceService {

    constructor(private jolokiaService: JVM.JolokiaService, private springBootService: SpringBootService) {
      'ngInject';
    }

    getTraces(): ng.IPromise<Trace[]> {
      const mbean: EndpointMBean = this.springBootService.getEndpointMBean(['Httptrace'], ['getData', 'traces'])
      return this.jolokiaService.execute(mbean.objectName, mbean.operation)
        .then(response => {
          const data = response.traces ? response.traces : response;
          return data.filter(trace => {
            const path = trace.info ? trace.info.path : trace.request.uri;
            // Avoid including our own jolokia requests in the results
            return /.*?\/jolokia\/?(?:\/.*(?=$))?$/.test(path) === false;
          })
          .map(traceEvent => new Trace(traceEvent));
        })
    }
  }
}
