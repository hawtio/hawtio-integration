namespace Runtime {

  export class MetricsService {

    constructor(private jolokia: Jolokia.IJolokia, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    registerJolokiaRequests(scope: ng.IScope, callback: any): void {
      let requests = [
        this.createMBeanRequest('java.lang:type=Threading'),
        this.createMBeanRequest('java.lang:type=Memory'),
        this.createMBeanRequest('java.lang:type=OperatingSystem'),
        this.createMBeanRequest('java.lang:type=ClassLoading'),
        this.createMBeanRequest('java.lang:type=Runtime'),
        this.createMBeanRequest('org.springframework.boot:type=Endpoint,name=metricsEndpoint')
      ];

      Core.register(this.jolokia, scope, requests, Core.onSuccess(callback));
    }

    unregisterJolokiaRequests(scope: ng.IScope): void {
      Core.unregister(this.jolokia, scope);
    }

    createMetric(name: string, value: any, unit?:string): Metric {
      return new Metric(name, value, unit);
    }

    createUtilizationMetric(name: string, used: any, total: any, unit?:string): UtilizationMetric {
      return new UtilizationMetric(name, used, total, unit);
    }

    private createMBeanRequest(mbean: string): any {
      return {
        type: 'read',
        mbean: mbean,
        arguments: []
      };
    }
  }
}
