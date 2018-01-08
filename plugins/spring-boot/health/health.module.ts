/// <reference path="health.component.ts"/>
/// <reference path="health.service.ts"/>

namespace SpringBoot {

  export const healthModule = angular
    .module('spring-boot-health', [])
    .component('springBootHealth', healthComponent)
    .service('healthService', HealthService)
    .name;

}