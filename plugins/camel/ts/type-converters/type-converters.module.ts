/// <reference path="type-converters.component.ts"/>
/// <reference path="type-converters-statistics.component.ts"/>
/// <reference path="type-converters-table.component.ts"/>
/// <reference path="type-converters.service.ts"/>

namespace Camel {

  export const typeConvertersModule = angular
    .module('hawtio-camel-type-converters', [])
    .component('typeConverters', typeConvertersComponent)
    .component('typeConvertersStatistics', typeConvertersStatisticsComponent)
    .component('typeConvertersTable', typeConvertersTableComponent)
    .service('typeConvertersService', TypeConvertersService)
    .name;

}
