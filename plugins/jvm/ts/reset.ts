/// <reference path="./jvmPlugin.ts"/>

namespace JVM {

  _module.controller("JVM.ResetController", ["$scope", "localStorage", ($scope, localStorage) => {

    $scope.showAlert = false;

    $scope.doClearConnectSettings = () => {
      delete localStorage[connectionSettingsKey];
      $scope.showAlert = true;
    };

  }]);
}
