/// <reference path="metrics.component.ts"/>
/// <reference path="metrics.service.ts"/>

namespace Runtime {

  export const metricsModule = angular
    .module('runtime-metrics', [])
    .component('runtimeMetrics', metricsComponent)
    .service('metricsService', MetricsService)
    .name;

}
