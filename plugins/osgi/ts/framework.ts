/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

/**
 * @module Osgi
 */
module Osgi {
  _module.controller("Osgi.FrameworkController", ["$scope", "workspace", ($scope, workspace: Workspace) => {

    $scope.startLevelChanged = function () {
      if ($scope.config.startLevel) {
        if (parseInt($scope.config.startLevel) < parseInt($scope.config.initialBundleStartLevel)) {
          Core.notification("error", "Can't set Framework Start Level below Initial Bundle Start Level");
        } else {
          updateMbeanAttribute('FrameworkStartLevel', $scope.config.startLevel);
        }
      }
    };

    $scope.initialBundleStartLevelChanged = function () {
      if ($scope.config.initialBundleStartLevel) {
        updateMbeanAttribute('InitialBundleStartLevel', $scope.config.initialBundleStartLevel);
      }
    };

    function updateMbeanAttribute(name, value) {
      var mbean = getSelectionFrameworkMBean(workspace);
      if (mbean) {
        workspace.jolokia.request({
          type: 'write', mbean: mbean, attribute: name, value: value
        }, {
          error: response => Core.notification("error", response.error),
          success: response => Core.notification("success", "Configuration updated")
        });
      }
    }

    function updateContents() {
      var mbean = getSelectionFrameworkMBean(workspace);
      if (mbean) {
        var jolokia = workspace.jolokia;
        jolokia.request(
          { type: 'read', mbean: mbean },
          Core.onSuccess(populatePage));
      }
    }

    function populatePage(response) {
      $scope.config = {
        startLevel: response.value.FrameworkStartLevel,
        initialBundleStartLevel: response.value.InitialBundleStartLevel
      }
      Core.$apply($scope);
    }

    updateContents();

  }]);
}
