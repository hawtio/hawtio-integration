/// <reference path="layout.controller.ts"/>
/// <reference path="layout.service.ts"/>

namespace SpringBoot {

  export const layoutModule = angular
    .module('spring-boot-layout', [])
    .controller('SpringBootLayoutController', SpringBootLayoutController)
    .service('springBootLayoutService', SpringBootLayoutService)
    .name;

}