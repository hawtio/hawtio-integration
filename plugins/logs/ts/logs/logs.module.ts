/// <reference path="log-modal.component.ts"/>
/// <reference path="logs.component.ts"/>
/// <reference path="logs.config.ts"/>
/// <reference path="logs.filters.ts"/>
/// <reference path="logs.service.ts"/>

namespace Logs {

  export const logsModule = angular.module('hawtio-logs-logs', [])
    .config(configureLogsRoutes)
    .run(configureLogsHelp)
    .run(configureLogsMainNav)
    .filter('logDateFilter', logDateFilter)
    .filter('highlight', highlight)
    .component('logs', logsComponent)
    .component('logModal', logModalComponent)
    .service('logsService', LogsService)
    .name;

}
