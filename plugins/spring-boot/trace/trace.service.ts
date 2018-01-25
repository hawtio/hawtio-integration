/// <reference path="trace.ts"/>

namespace SpringBoot {

  export class TraceService {

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getTraces(): ng.IPromise<Trace[]> {
      return this.jolokiaService.getAttribute('org.springframework.boot:type=Endpoint,name=traceEndpoint', 'Data')
        .then(data => {
          let traces: Trace[] = [];

          // Avoid including our own jolokia requests in the results
          let filteredTraces = data.filter(trace => {return /^\/jolokia\/?(?:\/.*(?=$))?$/.test(trace.info.path) === false;});

          angular.forEach(filteredTraces, (traceEvent) => {
            traces.push(new Trace(traceEvent));
          });

          return traces;
        })
    }
  }
}
