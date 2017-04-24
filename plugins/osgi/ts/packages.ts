/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

/**
 * @module Osgi
 */
module Osgi {

  export var PackagesController = _module.controller("Osgi.PackagesController", ["$scope", "$filter", "workspace", "$templateCache", "$compile", (
      $scope,
      $filter: ng.IFilterService,
      workspace: Jmx.Workspace,
      $templateCache: ng.ITemplateCacheService,
      $compile: ng.IAttributes) => {

    $scope.packages = null;

    $scope.$watch('workspace.selection', function() {
      updateTableContents();
    });

    function populateTable(response) {
      var packages = Osgi.defaultPackageValues(workspace, $scope, response.value);
      augmentPackagesInfo(packages);
    }

    function augmentPackagesInfo(packages) {
      var bundleMap = {};
      var createBundleMap = function(response) {
        angular.forEach(response.value, function(value, key) {
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
        angular.forEach(packages, function(p, key) {
          angular.forEach(p["ExportingBundles"], function(b, key) {
            p["ExportingBundles"][key] = bundleMap[b];
          });
          angular.forEach(p["ImportingBundles"], function(b, key) {
            p["ImportingBundles"][key] = bundleMap[b];
          });
          p["ExportingBundles"].sort(sortBy('SymbolicName'));
          p["ImportingBundles"].sort(sortBy('SymbolicName'));
        });
        packages.sort(sortBy('Name'));
        $scope.packages = packages;
        Core.$apply($scope);
       };
      workspace.jolokia.request({
            type: 'exec',
            mbean: getSelectionBundleMBean(workspace),
            operation: 'listBundles()'
          },
          {
            success: createBundleMap,
            error: createBundleMap
          });
    }

    function sortBy(fieldName: string) {
      return function(a, b) {
        var valueA = a[fieldName].toLowerCase();
        var valueB = b[fieldName].toLowerCase();
        if (valueA < valueB) {
          return -1;
        }
        if (valueA > valueB) {
          return 1;
        }
        return 0;
      }
    }

    function updateTableContents() {
      var mbean = getSelectionPackageMBean(workspace);
      if (mbean) {
        var jolokia = workspace.jolokia;
        // bundles first:
        jolokia.request({
              type: 'exec',
              mbean: mbean,
              operation: 'listPackages'
            },
            Core.onSuccess(populateTable));
      }
    }
  }]);
}
