/// <reference path="../../includes.ts"/>
/// <reference path="mavenHelpers.ts"/>

/**
 * @module Maven
 * @main Maven
 */
module Maven {
  var pluginName = 'maven';

  export var _module = angular.module(pluginName, ['ngResource', 'datatable', 'tree', 'hawtio-core', 'hawtio-ui']);
  //export var _module = angular.module(pluginName, ['bootstrap', 'ngResource', 'datatable', 'tree', 'hawtio-core', 'hawtio-ui']);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
            when('/maven', { redirectTo: '/maven/search' }).
            when('/maven/search', {templateUrl: 'plugins/maven/html/search.html'}).
            when('/maven/advancedSearch', {templateUrl: 'plugins/maven/html/advancedSearch.html'}).
            when('/maven/artifact/:group/:artifact/:version/:classifier/:packaging', {templateUrl: 'plugins/maven/html/artifact.html'}).
            when('/maven/artifact/:group/:artifact/:version/:classifier', {templateUrl: 'plugins/maven/html/artifact.html'}).
            when('/maven/artifact/:group/:artifact/:version', {templateUrl: 'plugins/maven/html/artifact.html'}).
            when('/maven/dependencies/:group/:artifact/:version/:classifier/:packaging', {templateUrl: 'plugins/maven/html/dependencies.html'}).
            when('/maven/dependencies/:group/:artifact/:version/:classifier', {templateUrl: 'plugins/maven/html/dependencies.html'}).
            when('/maven/dependencies/:group/:artifact/:version', {templateUrl: 'plugins/maven/html/dependencies.html'}).
            when('/maven/versions/:group/:artifact/:classifier/:packaging', {templateUrl: 'plugins/maven/html/versions.html'}).
            when('/maven/view/:group/:artifact/:version/:classifier/:packaging', {templateUrl: 'plugins/maven/html/view.html'}).
            when('/maven/test', { templateUrl: 'plugins/maven/html/test.html'});
  }]);

  _module.run(["HawtioNav", "$location", "workspace", "viewRegistry", "helpRegistry", (nav:HawtioMainNav.Registry, $location:ng.ILocationService, workspace:Workspace, viewRegistry, helpRegistry) => {

    //viewRegistry['maven'] = "plugins/maven/html/layoutMaven.html";
    var builder = nav.builder();

    var search = builder.id('maven-search')
                    .title( () => 'Search' )
                    .href( () => '/maven/search' + workspace.hash() )
                    .isSelected( () => workspace.isLinkPrefixActive('/maven/search') )
                    .build();
    var advanced = builder.id('maven-advanced-search')
                    .title( () => 'Advanced Search' )
                    .href( () => '/maven/advancedSearch' + workspace.hash() )
                    .isSelected( () => workspace.isLinkPrefixActive('/maven/advancedSearch') )
                    .build();


    var tab = builder.id('maven')
                .title( () => 'Maven' )
                .isValid( () => Maven.getMavenIndexerMBean(workspace) )
                .href( () => '/maven' )
                .isSelected( () => workspace.isLinkActive('/maven') )
                .tabs(search, advanced)
                .build();

    nav.add(tab);

    /*
    workspace.topLevelTabs.push({
      id: "maven",
      content: "Maven",
      title: "Search maven repositories for artifacts",
      isValid: (workspace: Workspace) => Maven.getMavenIndexerMBean(workspace),
      href: () => "#/maven/search",
      isActive: (workspace: Workspace) => workspace.isLinkActive("/maven")
    });
    */

    helpRegistry.addUserDoc('maven', 'plugins/maven/doc/help.md', () => {
      return Maven.getMavenIndexerMBean(workspace) !== null;
    });
    helpRegistry.addDevDoc("maven", 'plugins/maven/doc/developer.md');

  }]);

  hawtioPluginLoader.addModule(pluginName);
}
