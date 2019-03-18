/// <reference path="../jmx/ts/tree/tree.service.ts"/>

namespace Runtime {

  export function configureRoutes($routeProvider: angular.route.IRouteProvider) {
    'ngInject';
    $routeProvider
      .when('/runtime/sysprops', {template: '<runtime-system-properties></runtime-system-properties>'})
      .when('/runtime/metrics', {template: '<runtime-metrics></runtime-metrics>'})
      .when('/runtime/threads', {template: '<runtime-threads></runtime-threads>'})
  }

  export function configureHelp(helpRegistry: Help.HelpRegistry) {
    'ngInject';
    helpRegistry.addUserDoc('runtime', 'plugins/runtime/doc/help.md');
  }

  export function configureMainNav(mainNavService: Nav.MainNavService, workspace: Jmx.Workspace) {
    'ngInject';
    mainNavService.addItem({
      title: 'Runtime',
      basePath: '/runtime',
      template: '<runtime></runtime>',
      isValid: () => workspace.treeContainsDomainAndProperties('java.lang')
    });
  }
}
