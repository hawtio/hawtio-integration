/// <reference path="trace.component.ts"/>
/// <reference path="trace.service.ts"/>

namespace SpringBoot {

  export const traceModule = angular
    .module('spring-boot-trace', [])
    .component('springBootTrace', traceComponent)
    .service('traceService', TraceService)
    .name;

}