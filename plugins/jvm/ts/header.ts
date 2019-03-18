/// <reference path="jvmPlugin.ts"/>

namespace JVM {

  export var HeaderController = _module.controller("JVM.HeaderController", ["$scope", "ConnectOptions", ($scope, ConnectOptions) => {
    if (ConnectOptions) {
      $scope.containerName = ConnectOptions.name || "";
      if (ConnectOptions.returnTo) {
        $scope.goBack = () => {
          window.location.href = ConnectOptions.returnTo;
        }
      }
    }

  }]);

}
