/// <reference path="loggers.component.ts"/>
/// <reference path="loggers.service.ts"/>

namespace SpringBoot {

  export const loggersModule = angular
    .module('spring-boot-loggers', [])
    .component('springBootLoggers', loggersComponent)
    .service('loggersService', LoggersService)
    .name;

}