/// <reference path="health/health.module.ts"/>
/// <reference path="trace/trace.module.ts"/>
/// <reference path="loggers/loggers.module.ts"/>
/// <reference path="spring-boot.config.ts"/>
/// <reference path="spring-boot.component.ts"/>
/// <reference path="spring-boot.service.ts"/>

namespace SpringBoot {

  const springBootModule = angular
    .module('hawtio-spring-boot', [
      healthModule,
      loggersModule,
      traceModule
    ])
    .config(configureRoutes)
    .run(configureLayout)
    .component('springBoot', springBootComponent)
    .service('springBootService', SpringBootService)
    .name;

  hawtioPluginLoader.addModule(springBootModule);

  export const log = Logger.get(springBootModule);

}