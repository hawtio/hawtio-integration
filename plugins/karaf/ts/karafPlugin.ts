/// <reference path="karafHelpers.ts"/>
/// <reference path="features/features.module.ts"/>
/// <reference path="scr-components/scr-components.module.ts"/>
/// <reference path="scr-components/scr-component-detail.component.ts"/>

namespace Karaf {

  var pluginName = 'karaf';

  export var _module = angular.module(pluginName, [
    'patternfly',
    'infinite-scroll',
    featuresModule,
    scrComponentsModule
  ]);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
            when('/osgi/server', {templateUrl: 'plugins/karaf/html/server.html'}).
            when('/osgi/features', {template: '<features></features>'}).
            when('/osgi/scr-components', {template: '<scr-list-components></scr-list-components>'}).
            when('/osgi/scr-components/:name', {template: '<scr-component-detail></scr-component-detail>'}).
            when('/osgi/feature/:name/:version', {templateUrl: 'plugins/karaf/html/feature.html'})
  }]);


  _module.run(["workspace", "viewRegistry", "helpRegistry", (
      workspace: Jmx.Workspace,
      viewRegistry,
      helpRegistry) => {

    helpRegistry.addUserDoc('karaf', 'plugins/karaf/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties('org.apache.karaf');
    });

  }]);

  hawtioPluginLoader.addModule(pluginName);
}
