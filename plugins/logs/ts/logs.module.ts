/// <reference path="logs-preferences/logs-preferences.module.ts"/>
/// <reference path="logs/logs.module.ts"/>

namespace Logs {
  
  const module = angular.module('hawtio-logs', [
    logsModule,
    logsPreferencesModule
  ])
  .name;

  hawtioPluginLoader.addModule(module);
}
