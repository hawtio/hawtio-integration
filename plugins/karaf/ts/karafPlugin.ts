/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>

/**
 * @module Karaf
 * @main Karaf
 */
module Karaf {
  var pluginName = 'karaf';
  //export var _module = angular.module(pluginName, ['bootstrap', 'ngResource', 'hawtio-core']);
  export var _module = angular.module(pluginName, ['ngResource', 'hawtio-core']);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
            when('/osgi/server', {templateUrl: 'plugins/karaf/html/server.html'}).
            when('/osgi/features', {templateUrl: 'plugins/karaf/html/features.html', reloadOnSearch: false}).
            when('/osgi/scr-components', {templateUrl: 'plugins/karaf/html/scr-components.html'}).
            when('/osgi/scr-component/:name', {templateUrl: 'plugins/karaf/html/scr-component.html'}).
            when('/osgi/feature/:name/:version', {templateUrl: 'plugins/karaf/html/feature.html'})
  }]);


  _module.run(["workspace", "viewRegistry", "helpRegistry", (workspace:Workspace, viewRegistry, helpRegistry) => {

    helpRegistry.addUserDoc('karaf', 'plugins/karaf/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties('org.apache.karaf');
    });

  }]);

  hawtioPluginLoader.addModule(pluginName);
}
