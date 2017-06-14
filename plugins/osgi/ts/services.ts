/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export var ServiceController = _module.controller("Osgi.ServiceController", ["$scope", "$filter", "workspace", "$templateCache", "$compile", (
    $scope,
    $filter: ng.IFilterService,
    workspace: Jmx.Workspace,
    $templateCache: ng.ITemplateCacheService,
    $compile: ng.IAttributes) => {

    $scope.workspace = workspace;
    $scope.services = null;

    var populateTable = function (response) {
      var services = Osgi.defaultServiceValues(workspace, $scope, response.value);
      augmentServicesInfo(services);
    };

    function augmentServicesInfo(services) {
      var bundleMap = {};
      var createBundleMap = function (response) {
        angular.forEach(response.value, function (value, key) {
          var obj = {
            Identifier: value.Identifier,
            Name: "",
            SymbolicName: value.SymbolicName,
            State: value.State,
            Version: value.Version,
            LastModified: value.LastModified,
            Location: value.Location,
            Url: Core.url("/osgi/bundle/" + value.Identifier + workspace.hash())
          };
          if (value.Headers['Bundle-Name']) {
            obj.Name = value.Headers['Bundle-Name']['Value'];
          }
          bundleMap[obj.Identifier] = obj;
        });
        var servicesArray = [];
        angular.forEach(services, function (s, key) {
          s.Url = Core.url("/osgi/bundle/" + s.Identifier + workspace.hash())
          angular.forEach(s["UsingBundles"], function (b, key) {
            s["UsingBundles"][key] = bundleMap[b];
          });
          servicesArray.push(s);
        });
        $scope.services = servicesArray;
        Core.$apply($scope);
      };
      workspace.jolokia.request({
        type: 'exec',
        mbean: getSelectionBundleMBean(workspace),
        operation: 'listBundles()'
      }, {
        success: createBundleMap,
        error: (response) => {
          log.debug('Osgi.ServiceController.augmentServicesInfo() failed: ' + response.error);
        }
      });
    }

    function loadServices() {
      var mbean = getSelectionServiceMBean(workspace);
      if (mbean) {
        var jolokia = workspace.jolokia;
        jolokia.request({
          type: 'exec',
          mbean: mbean,
          operation: 'listServices()'
        }, {
          success: populateTable,
          error: (response) => {
            log.debug('Osgi.ServiceController.loadServices() failed: ' + response.error);
          }
        });
      }
    }

    loadServices();

  }]);
}
