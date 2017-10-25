/// <reference path="osgiData.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="../../karaf/ts/karafHelpers.ts"/>
/// <reference path="bundles/bundles.module.ts"/>

namespace Osgi {

  export var pluginName = 'osgi';
  export var _module = angular.module(pluginName, [
    'patternfly',
    'infinite-scroll',
    bundlesModule
  ]);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider
            .when('/osgi', { redirectTo: '/osgi/bundles' })
            .when('/osgi/bundles', {template: '<bundles></bundles>'})
            .when('/osgi/bundle/:bundleId', {templateUrl: 'plugins/osgi/html/bundle.html'})
            .when('/osgi/services', {templateUrl: 'plugins/osgi/html/services.html'})
            .when('/osgi/packages', {templateUrl: 'plugins/osgi/html/packages.html'})
            .when('/osgi/configurations', {templateUrl: 'plugins/osgi/html/configurations.html'})
            .when('/osgi/pid/:pid/:factoryPid', {templateUrl: 'plugins/osgi/html/pid.html'})
            .when('/osgi/pid/:pid', {templateUrl: 'plugins/osgi/html/pid.html'})
            .when('/osgi/fwk', {templateUrl: 'plugins/osgi/html/framework.html'});
  }]);

  _module.run(["HawtioNav", "workspace", "viewRegistry", "helpRegistry", (
      nav: HawtioMainNav.Registry,
      workspace: Jmx.Workspace,
      viewRegistry,
      helpRegistry) => {

    viewRegistry['osgi'] = "plugins/osgi/html/layoutOsgi.html";
    
    helpRegistry.addUserDoc('osgi', 'plugins/osgi/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties("osgi.core");
    });

    var builder = nav.builder();
    var tab = builder.id('osgi')
                    .title( () => 'OSGi' )
                    .href( () => '/osgi' )
                    .isValid( () => workspace.treeContainsDomainAndProperties("osgi.core") )
                    .isSelected( () => workspace.isLinkActive('osgi') )
                    .build();
    nav.add(tab);
  }]);

  _module.factory('osgiDataService', ["workspace", "jolokia", (workspace: Jmx.Workspace, jolokia) => {
    return new OsgiDataService(workspace, jolokia);
  }]);

  hawtioPluginLoader.addModule(pluginName);
}
