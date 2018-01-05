/// <reference path="health.component.ts"/>

namespace SpringBoot {

  export const healthModule = angular
    .module('spring-boot-health', [])
    .component('springBootHealth', healthComponent)
    .name;

}