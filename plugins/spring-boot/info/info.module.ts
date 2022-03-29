/// <reference path="info.component.ts"/>
/// <reference path="info.service.ts"/>

namespace SpringBoot {

  export const infoModule = angular
    .module('spring-boot-info', [])
    .component('springBootInfo', infoComponent)
    .service('infoService', InfoService)
    .name;

}
