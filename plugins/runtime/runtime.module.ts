/// <reference path="sysprops/sysprops.module.ts"/>
/// <reference path="metrics/metrics.module.ts"/>
/// <reference path="threads/threads.module.ts"/>
/// <reference path="runtime.config.ts"/>
/// <reference path="runtime.component.ts"/>
/// <reference path="runtime.service.ts"/>

namespace Runtime {

  const runtimeModule = angular
    .module('hawtio-jmx-runtime', [
      systemPropertiesModule,
      metricsModule,
      threadsModule
    ])
    .config(configureRoutes)
    .run(configureHelp)
    .run(configureMainNav)
    .component('runtime', runtimeComponent)
    .service('runtimeService', RuntimeService)
    .name;

  hawtioPluginLoader.addModule(runtimeModule);

  export const log = Logger.get(runtimeModule);
}
