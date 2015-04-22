/// <reference path="../../includes.ts"/>
/// <reference path="../../git/ts/gitHelpers.ts"/>
/// <reference path="wikiHelpers.ts"/>
/// <reference path="wikiPlugin.ts"/>

module Wiki {

  export var TopLevelController = _module.controller("Wiki.TopLevelController", ['$scope', 'workspace', '$route', '$routeParams', ($scope, workspace:Core.Workspace, $route, $routeParams) => {

/*
TODO
    $scope.managerMBean = Fabric.managerMBean;
    $scope.clusterBootstrapManagerMBean = Fabric.clusterBootstrapManagerMBean;
    $scope.clusterManagerMBean = Fabric.clusterManagerMBean;
    $scope.openShiftFabricMBean = Fabric.openShiftFabricMBean;
    $scope.mqManagerMBean = Fabric.mqManagerMBean;
    $scope.healthMBean = Fabric.healthMBean;
    $scope.schemaLookupMBean = Fabric.schemaLookupMBean;
    $scope.gitMBean = Git.getGitMBean(workspace);
    $scope.configAdminMBean = Osgi.getHawtioConfigAdminMBean(workspace);
*/
  }]);

}
