/// <reference path="../../karaf/ts/karafHelpers.ts"/>
/// <reference path="bundles/bundles.module.ts"/>
/// <reference path="configuration/configuration.module.ts"/>
/// <reference path="framework/framework.module.ts"/>
/// <reference path="osgi.component.ts"/>
/// <reference path="osgiData.ts"/>
/// <reference path="osgiHelpers.ts"/>

namespace Osgi {

  export const _module = angular
    .module(pluginName, [
      'infinite-scroll',
      bundlesModule,
      configurationModule,
      frameworkModule
    ])
    .component('osgi', osgiComponent);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider
      .when('/osgi/bundles', { template: '<bundles></bundles>' })
      .when('/osgi/bundles/:bundleId', { templateUrl: 'plugins/osgi/html/bundle.html' })
      .when('/osgi/services', { templateUrl: 'plugins/osgi/html/services.html' })
      .when('/osgi/packages', { templateUrl: 'plugins/osgi/html/packages.html' })
      .when('/osgi/configurations', { templateUrl: 'plugins/osgi/html/configurations.html' })
      .when('/osgi/configurations/:id', { template: '<osgi-configuration></osgi-configuration>' })
      .when('/osgi/fwk', { template: '<framework></framework>' });
  }]);

  _module.run(["mainNavService", "workspace", "helpRegistry", (mainNavService: Nav.MainNavService,
    workspace: Jmx.Workspace, helpRegistry) => {

    helpRegistry.addUserDoc('osgi', 'plugins/osgi/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties("osgi.core");
    });

    mainNavService.addItem({
      title: 'OSGi',
      basePath: '/osgi',
      template: '<osgi></osgi>',
      isValid: () => workspace.treeContainsDomainAndProperties("osgi.core")
    });
  }]);

  _module.factory('osgiDataService', ["workspace", "jolokia", (workspace: Jmx.Workspace, jolokia) => {
    return new OsgiDataService(workspace, jolokia);
  }]);

  hawtioPluginLoader.addModule(pluginName);
}
