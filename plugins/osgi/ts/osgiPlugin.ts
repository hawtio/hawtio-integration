/// <reference path="../../includes.ts"/>
/// <reference path="osgiData.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="../../karaf/ts/karafHelpers.ts"/>

/**
 * @module Osgi
 * @main Osgi
 */
module Osgi {
  export var pluginName = 'osgi';
  export var _module = angular.module(pluginName, []);
  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider
            .when('/osgi', { redirectTo: '/osgi/bundle-list' })
            .when('/osgi/bundle-list', {templateUrl: 'plugins/osgi/html/bundle-list.html'})
            .when('/osgi/bundles', {templateUrl: 'plugins/osgi/html/bundles.html'})
            .when('/osgi/bundle/:bundleId', {templateUrl: 'plugins/osgi/html/bundle.html'})
            .when('/osgi/services', {templateUrl: 'plugins/osgi/html/services.html'})
            .when('/osgi/packages', {templateUrl: 'plugins/osgi/html/packages.html'})
            .when('/osgi/package/:package/:version', {templateUrl: 'plugins/osgi/html/package.html'})
            .when('/osgi/configurations', {templateUrl: 'plugins/osgi/html/configurations.html'})
            .when('/osgi/pid/:pid/:factoryPid', {templateUrl: 'plugins/osgi/html/pid.html'})
            .when('/osgi/pid/:pid', {templateUrl: 'plugins/osgi/html/pid.html'})
            .when('/osgi/fwk', {templateUrl: 'plugins/osgi/html/framework.html'})
            .when('/osgi/dependencies', {templateUrl: 'plugins/osgi/html/svc-dependencies.html', reloadOnSearch: false });
  }]);

  _module.run(["HawtioNav", "workspace", "viewRegistry", "helpRegistry", (nav:HawtioMainNav.Registry, workspace:Workspace, viewRegistry, helpRegistry) => {

    //viewRegistry['osgi'] = "plugins/osgi/html/layoutOsgi.html";
    helpRegistry.addUserDoc('osgi', 'plugins/osgi/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties("osgi.core");
    });

    var builder = nav.builder();
    var configuration = builder.id('osgi-configuration')
                          .href( () => '/osgi/configurations' + workspace.hash() )
                          .title( () => 'Configuration' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/configuration') 
                                          || workspace.isLinkPrefixActive('/osgi/pid') )
                          .build();
    var bundles = builder.id('osgi-bundles')
                          .href( () => '/osgi/bundle-list' + workspace.hash() )
                          .title( () => 'Bundles' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/bundle') )
                          .build();
    var features = builder.id('osgi-features')
                          .href( () => '/osgi/features' + workspace.hash() )
                          .title( () => 'Features' )
                          .show( () => !Core.isBlank(Karaf.getSelectionFeaturesMBean(workspace)) )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/feature') )
                          .build();
    var packages = builder.id('osgi-packages')
                          .href( () => '/osgi/packages' + workspace.hash() )
                          .title( () => 'Packages' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/package') )
                          .build();
    var services = builder.id('osgi-services')
                          .href( () => '/osgi/services' + workspace.hash() )
                          .title( () => 'Services' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/service') )
                          .build();
    var scrComponents = builder.id('osgi-scr-components')
                          .href( () => '/osgi/scr-components' + workspace.hash() )
                          .title( () => 'Declarative Services' )
                          .show( () => !Core.isBlank(Karaf.getSelectionScrMBean(workspace)) )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/scr-component') )
                          .build();
    var server = builder.id('osgi-server')
                          .href( () => '/osgi/server' + workspace.hash() )
                          .title( () => 'Server' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/server') )
                          .build();
    var fwk = builder.id('osgi-fwk')
                          .href( () => '/osgi/fwk' + workspace.hash() )
                          .title( () => 'Framework' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/fwk') )
                          .build();
    var dependencies = builder.id('osgi-dependencies')
                          .href( () => '/osgi/dependencies' + workspace.hash() )
                          .title( () => 'Dependencies' )
                          .isSelected( () => workspace.isLinkPrefixActive('/osgi/dependencies') )
                          .build();

    var tab = builder.id('osgi')
                    .title( () => 'OSGi' )
                    .href( () => '/osgi' )
                    .isValid( () => workspace.treeContainsDomainAndProperties("osgi.core") )
                    .isSelected( () => workspace.isLinkActive('osgi') )
                    .tabs( configuration, bundles, features, packages, services, scrComponents, server, fwk, dependencies )
                    .build();
    nav.add(tab);

    /*
    workspace.topLevelTabs.push({
      id: "osgi",
      content: "OSGi",
      title: "Visualise and manage the bundles and services in this OSGi container",
      isValid: (workspace: Workspace) => workspace.treeContainsDomainAndProperties("osgi.core"),
      href: () => "#/osgi/bundle-list",
      isActive: (workspace: Workspace) => workspace.isLinkActive("osgi")
    });
    */
  }]);

  _module.factory('osgiDataService', ["workspace", "jolokia", (workspace: Workspace, jolokia) => {
    return new OsgiDataService(workspace, jolokia);
  }]);

  hawtioPluginLoader.addModule(pluginName);
}
