/// <reference path="logs-preferences.config.ts"/>
/// <reference path="logs-preferences.controller.ts"/>

namespace Logs {
  
  export const logsPreferencesModule = angular.module('hawtio-logs-preferences', [])
    .run(configureLogsPreferences)
    .controller('LogsPreferencesController', LogsPreferencesController)
    .name;

}
