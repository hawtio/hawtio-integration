/// <reference path="logs.service.ts"/>

namespace Logs {

  export function configureLogsRoutes($routeProvider: ng.route.IRouteProvider) {
    'ngInject';
    $routeProvider.when('/logs', {template: '<logs></logs>'});
  }

  export function configureLogsHelp(helpRegistry: Help.HelpRegistry, logsService: LogsService) {
    'ngInject';
    helpRegistry.addUserDoc('log', 'plugins/logs/doc/help.md', () => logsService.isValid());
  }

  export function configureLogsMainNav(mainNavService: Nav.MainNavService, logsService: LogsService) {
    'ngInject';
    mainNavService.addItem({
      title: 'Logs',
      href: '/logs',
      isValid: () => logsService.isValid(),
      rank: -1
    });
  }

}
