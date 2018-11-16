/// <reference path="health/health.module.ts"/>
/// <reference path="trace/trace.module.ts"/>
/// <reference path="loggers/loggers.module.ts"/>
/// <reference path="spring-boot.config.ts"/>
/// <reference path="spring-boot.component.ts"/>
/// <reference path="spring-boot.service.ts"/>

namespace SpringBoot {

  export const springBootModule = angular
    .module('hawtio-integration-spring-boot', [
      healthModule,
      loggersModule,
      traceModule
    ])
    .config(configureRoutes)
    .run(configureHelp)
    .run(configureLayout)
    .component('springBoot', springBootComponent)
    .service('springBootService', SpringBootService)
    .name;

  export const log: Logging.Logger = Logger.get(springBootModule);

}
