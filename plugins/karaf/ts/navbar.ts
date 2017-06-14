/// <reference path="karafHelpers.ts"/>
/// <reference path="karafPlugin.ts"/>

namespace Karaf {

  _module.controller("Karaf.NavBarController", ["$scope", "$location", "workspace", ($scope, $location,
    workspace: Jmx.Workspace) => {

    $scope.hash = workspace.hash();

    $scope.isKarafEnabled = workspace.treeContainsDomainAndProperties("org.apache.karaf")
    $scope.isFeaturesEnabled = Karaf.getSelectionFeaturesMBean(workspace);
    $scope.isScrEnabled = Karaf.getSelectionScrMBean(workspace);

    $scope.$on('$routeChangeSuccess', () => {
      $scope.hash = workspace.hash();
    });

    $scope.isActive = (path: string) => workspace.isLinkActive(path);

    $scope.isPrefixActive = (path: string) => workspace.isLinkPrefixActive(path);

    $scope.goto = (path: string) => $location.path(path);
  }]);
}
