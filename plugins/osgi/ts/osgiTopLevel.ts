/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export var TopLevelController = _module.controller("Osgi.TopLevelController", ["$scope", "workspace", (
      $scope,
      workspace: Jmx.Workspace) => {

    $scope.bundleMBean = Osgi.getSelectionBundleMBean(workspace);
    $scope.serviceMBean = Osgi.getSelectionServiceMBean(workspace);
    $scope.packageMBean = Osgi.getSelectionPackageMBean(workspace);
    $scope.metaTypeMBean = Osgi.getMetaTypeMBean(workspace);

  }]);

}
