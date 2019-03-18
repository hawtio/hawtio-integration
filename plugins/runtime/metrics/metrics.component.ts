/// <reference path="metrics.service.ts"/>
/// <reference path="metric.ts"/>

namespace Runtime {

  export class MetricsController {

    private loading: boolean;

    private metricGroups: MetricGroup[] = [];

    constructor(private $scope,
                private metricsService: MetricsService,
                private $filter: ng.IFilterService,
                private humanizeService: Core.HumanizeService) {
      'ngInject';
    }

    $onInit() {
      this.loading = true;
      this.metricsService.registerJolokiaRequests(this.$scope, (result:any) => {
        this.loading = false;
        this.loadMetrics(result);
      });
    }

    $onDestroy() {
      this.metricsService.unregisterJolokiaRequests(this.$scope);
    }

    private loadMetrics(result: any) {
      let metrics = result.value;
      let updates: Metric[] = [];
      let updateType: MetricType;

      switch (result.request.mbean) {
        case 'java.lang:type=Threading':
          updateType = MetricType.JVM;
          updates.push(this.metricsService.createMetric('Thread count', metrics.ThreadCount));
          break;
        case 'java.lang:type=Memory':
          updateType = MetricType.JVM;
          let heapUsed = this.formatBytes(metrics.HeapMemoryUsage.used);
          updates.push(this.metricsService.createMetric('Heap used', heapUsed[0], heapUsed[1]));
          break;
        case 'java.lang:type=OperatingSystem':
          let filterNumeric = this.$filter('number');
          let cpuLoad = filterNumeric(metrics.SystemCpuLoad * 100, 2);
          let loadAverage = filterNumeric(metrics.SystemLoadAverage, 2);
          let memFree = this.formatBytes(metrics.FreePhysicalMemorySize);
          let memTotal = this.formatBytes(metrics.TotalPhysicalMemorySize);
          updateType = MetricType.SYSTEM;

          updates.push(this.metricsService.createMetric('Available processors', metrics.AvailableProcessors));
          updates.push(this.metricsService.createMetric('CPU load', cpuLoad, '%'));
          updates.push(this.metricsService.createMetric('Load average', loadAverage));
          updates.push(this.metricsService.createUtilizationMetric('Memory used', memFree[0], memTotal[0], memFree[1]));
          updates.push(this.metricsService.createUtilizationMetric('File descriptors used', metrics.OpenFileDescriptorCount, metrics.MaxFileDescriptorCount));
          break;
        case 'java.lang:type=ClassLoading':
          updateType = MetricType.JVM;
          updates.push(this.metricsService.createMetric('Classes loaded', metrics.LoadedClassCount));
          break;
        case 'java.lang:type=Runtime':
          let filterDate = this.$filter('date');
          updateType = MetricType.JVM;
          updates.push(this.metricsService.createMetric('Start time', filterDate(metrics.StartTime, 'yyyy-MM-dd HH:mm:ss')));
          updates.push(this.metricsService.createMetric('Uptime', Core.humanizeMilliseconds(metrics.Uptime)));
          break;
        case 'org.springframework.boot:type=Endpoint,name=metricsEndpoint':
          updateType = MetricType.SPRING_BOOT;

          // Filter out metrics that are already shown under JVM & Runtime
          Object.keys(metrics.Data).filter(key => {
            return !/^(mem|processors|instance|uptime|heap|nonheap|threads|classes|gc|systemload)/.test(key);
          }).forEach(metricName => {
            updates.push(this.metricsService.createMetric(this.humanizeService.toSentenceCase(metricName), metrics.Data[metricName]));
          });
          break;
      }

      this.getMetricGroup(updateType).updateMetrics(updates);
      Core.$apply(this.$scope);
    }

    private getMetricGroup(type: MetricType): MetricGroup {
      let match: MetricGroup[] = this.metricGroups.filter(group => {return group.type === type});
      if (match.length > 0) {
        return match[0];
      } else {
        let metricGroup: MetricGroup = new MetricGroup(type);
        this.metricGroups.push(metricGroup);
        return metricGroup;
      }
    }

    private formatBytes(bytes:number): any[] {
      if (bytes == 0) {
        return [0, 'Bytes'];
      }
      let killobyte = 1024;
      let decimalPlaces = 2;
      let units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      let i = Math.floor(Math.log(bytes) / Math.log(killobyte));
      let value = parseFloat((bytes / Math.pow(killobyte, i)).toFixed(decimalPlaces));
      let unit = units[i];
      return [value, unit]
    }
  }

  export const metricsComponent: angular.IComponentOptions = {
    template: `
      <div class="runtime-metrics-main">
        <h1>Metrics</h1>
        <div class="blank-slate-pf no-border" ng-if="$ctrl.loading === false && $ctrl.metricGroups.length === 0">
          <div class="blank-slate-pf-icon">
            <span class="pficon pficon pficon-warning-triangle-o"></span>
          </div>
          <h1>No Metrics</h1>
          <p>There are no metrics to display.</p>
          <p>Wait for some metrics to be generated or check your application configuration.</p>
        </div>
        <div class="cards-pf" ng-if="$ctrl.metricGroups.length > 0">
          <div class="container-fluid container-cards-pf">
            <div class="row row-cards-pf">
              <div ng-if="group.metrics.length > 0" class="col-xs-12 col-sm-6 col-md-4 col-lg-3" ng-repeat="group in $ctrl.metricGroups | orderBy: 'type'">
                <pf-card
                  head-title="{{group.type}}"
                  spinner-text="Loading">
                  <div class="card-pf-info-item" ng-repeat="metric in group.metrics | orderBy: 'name'">
                    {{metric.getDescription()}}
                  </div>
                </pf-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    controller: MetricsController
  }
}
