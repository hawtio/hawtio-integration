/// <reference path="../logs/logs.service.ts"/>

namespace Logs {

  export function configureLogsPreferences(preferencesRegistry, logsService: LogsService) {
    'ngInject';
    preferencesRegistry.addTab("Server Logs", "plugins/logs/html/logs-preferences.html", () => logsService.isValid());
  }

}
