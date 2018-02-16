/// <reference path="endpoints-statistics.component.ts"/>
/// <reference path="endpoints-statistics.service.ts"/>

namespace Camel {

  export const endpointsStatisticsModule = angular
    .module('hawtio-camel-endpoints-statistics', [])
    .component('endpointsStatistics', endpointsStatisticsComponent)
    .service('endpointsStatisticsService', EndpointsStatisticsService)
    .name;

}
