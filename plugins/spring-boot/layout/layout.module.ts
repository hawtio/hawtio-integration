/// <reference path="layout.controller.ts"/>

namespace SpringBoot {

  export const layoutModule = angular
    .module('spring-boot-layout', [])
    .controller('SpringBootLayoutController', SpringBootLayoutController)
    .name;

}