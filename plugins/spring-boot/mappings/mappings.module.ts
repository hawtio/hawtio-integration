/// <reference path="mappings.component.ts"/>
/// <reference path="mappings.service.ts"/>

namespace SpringBoot {

  export const mappingsModule = angular
    .module('spring-boot-mappings', [])
    .component('springBootMappings', mappingsComponent)
    .service('mappingsService', MappingsService)
    .name;

}