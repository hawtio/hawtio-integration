/// <reference path="diagnostics.config.ts"/>
/// <reference path="diagnostics.component.ts"/>
/// <reference path="diagnostics-jfr.controller.ts"/>
/// <reference path="diagnostics-heap.controller.ts"/>
/// <reference path="diagnostics-flags.controller.ts"/>
/// <reference path="diagnostics.service.ts"/>

namespace Diagnostics {

  const pluginName: string = 'hawtio-jmx-diagnostics';

  export const log: Logging.Logger = Logger.get(pluginName);
  
  export const _module = angular
    .module(pluginName, [])
    .config(configureRoutes)
    .run(configureHelp)
    .run(configureMainNav)
    .component("diagnostics", diagnosticsComponent)
    .controller("DiagnosticsJfrController", DiagnosticsJfrController)
    .controller("DiagnosticsHeapController", DiagnosticsHeapController)
    .controller("DiagnosticsFlagsController", DiagnosticsFlagsController)
    .service('diagnosticsService', DiagnosticsService);

  hawtioPluginLoader.addModule(pluginName);
}
