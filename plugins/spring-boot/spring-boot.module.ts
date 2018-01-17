/// <reference path="health/health.module.ts"/>
/// <reference path="mappings/mappings.module.ts"/>
/// <reference path="layout/layout.module.ts"/>
/// <reference path="spring-boot.config.ts"/>

namespace SpringBoot {
  
  const springBootModule = angular
    .module('hawtio-spring-boot', [
      healthModule,
      mappingsModule,
      layoutModule
    ])
    .config(configureRoutes)
    .run(configureNavigation)
    .name;

  hawtioPluginLoader.addModule(springBootModule);

  export const log = Logger.get(springBootModule);
  
}