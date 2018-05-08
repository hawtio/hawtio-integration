/// <reference path="karafPlugin.ts"/>

namespace Karaf {

  _module.controller("Karaf.FeatureController", ["$scope", "jolokia", "workspace", "$routeParams", (
      $scope,
      jolokia: Jolokia.IJolokia,
      workspace: Jmx.Workspace,
      $routeParams: angular.route.IRouteParamsService) => {

    $scope.featuresMBean = Karaf.getSelectionFeaturesMBean(workspace);
    $scope.name = $routeParams['name'];
    $scope.version = $routeParams['version'];
    $scope.bundlesByLocation = {};
    $scope.props = "properties";

    updateTableContents();

    $scope.install = () => {
      installFeature(workspace, jolokia, $scope.name, $scope.version, function () {
        Core.notification('success', 'Installed feature ' + $scope.name);
      }, function (response) {
        Core.notification('danger', 'Failed to install feature ' + $scope.name + ' due to ' + response.error);
      });
    };

    $scope.uninstall = () => {
      uninstallFeature(workspace, jolokia, $scope.name, $scope.version, function () {
        Core.notification('success', 'Uninstalled feature ' + $scope.name);
      }, function (response) {
        Core.notification('danger', 'Failed to uninstall feature ' + $scope.name + ' due to ' + response.error);
      });
    };

    $scope.toProperties = (elements) => {
      var answer = '';
      angular.forEach(elements, (value, name) => {
        answer += value['Key'] + " = " + value['Value'] + "\n";
      });
      return answer.trim();
    };

    function populateTable(response) {
      $scope.row = extractFeature(response.value, $scope.name, $scope.version);
      if ($scope.row) {
        addBundleDetails($scope.row);
        var dependencies = [];
        angular.forEach($scope.row.Dependencies, dependency => {
          angular.forEach(dependency, dependency => {
            if (dependency.Version === '0.0.0') {
              angular.forEach(response.value.Features[dependency.Name], feature => {
                dependency.Version = feature.Version;
              });
            }
            dependencies.push(dependency);
          });
        });
        $scope.row.Dependencies = dependencies;
      }
      Core.$apply($scope);
    }

    function setBundles(response) {
      var bundleMap = {};
      Osgi.defaultBundleValues(workspace, $scope, response.values);
      angular.forEach(response.value, (bundle) => {
        var location = bundle["Location"];
        $scope.bundlesByLocation[location] = bundle;
      });
    }

    function updateTableContents() {
      var featureMbean = getSelectionFeaturesMBean(workspace);
      var bundleMbean = Osgi.getSelectionBundleMBean(workspace);
      var jolokia = workspace.jolokia;

      if (bundleMbean) {
        setBundles(jolokia.request(
          {type: 'exec', mbean: bundleMbean, operation: 'listBundles()'}));
      }

      if (featureMbean) {
        jolokia.request(
          {type: 'read', mbean: featureMbean},
          Core.onSuccess(populateTable));
      }
    }

    function addBundleDetails(feature) {
      var bundleDetails = [];
      angular.forEach(feature["Bundles"], (bundleLocation)=> {
        var bundle = $scope.bundlesByLocation[bundleLocation];
        if (bundle) {
          bundle["Installed"] = true;
          bundleDetails.push(bundle);
        } else {
          bundleDetails.push({
            "Location": bundleLocation,
            "Installed": false
          })

        }
      });
      feature["BundleDetails"] = bundleDetails;
    }
  }]);
}
