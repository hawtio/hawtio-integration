/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export var PackagesController = _module.controller("Osgi.PackagesController", ["$scope", "workspace", (
    $scope, workspace: Jmx.Workspace) => {

    const INFINITE_SCROLL_INITIAL_SIZE = 50;
    const INFINITE_SCROLL_APPEND_SIZE = 10;

    $scope.packages = null;
    $scope.filteredPackages = [];
    $scope.scrollablePackages = [];

    $scope.toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'name',
            title: 'Name',
            placeholder: 'Filter by name...',
            filterType: 'text'
          },
          {
            id: 'version',
            title: 'Version',
            placeholder: 'Filter by version...',
            filterType: 'text'
          },
          {
            id: 'exporting-bundle',
            title: 'Exporting Bundle',
            placeholder: 'Filter by exporting bundle...',
            filterType: 'text'
          },
          {
            id: 'importing-bundle',
            title: 'Importing Bundle',
            placeholder: 'Filter by importing bundle...',
            filterType: 'text'
          }
        ],
        resultsCount: 0,
        totalCount: 0,
        appliedFilters: [],
        onFilterChange: filterChange
      }
    };

    $scope.appendItems = function () {
      let numRemainingItems = $scope.filteredPackages.length - $scope.scrollablePackages.length;
      if (numRemainingItems > 0) {
        let startIndex = $scope.scrollablePackages.length;
        let appendItems = $scope.filteredPackages.slice(startIndex, startIndex + INFINITE_SCROLL_APPEND_SIZE);
        $scope.scrollablePackages.push(...appendItems);
      }
    }

    function populateTable(response) {
      var packages = Osgi.defaultPackageValues(workspace, $scope, response.value);
      augmentPackagesInfo(packages);
    }

    function augmentPackagesInfo(packages) {
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
        angular.forEach(packages, function (p, key) {
          angular.forEach(p["ExportingBundles"], function (b, key) {
            p["ExportingBundles"][key] = bundleMap[b];
          });
          angular.forEach(p["ImportingBundles"], function (b, key) {
            p["ImportingBundles"][key] = bundleMap[b];
          });
          p["ExportingBundles"].sort(sortBy('SymbolicName'));
          p["ImportingBundles"].sort(sortBy('SymbolicName'));
        });

        packages.sort(sortBy('Name'));

        $scope.packages = packages;
        $scope.toolbarConfig.filterConfig.totalCount = packages.length;

        applyFilters($scope.toolbarConfig.filterConfig.appliedFilters);
        updateResultCount();

        initScrollableItems();

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
      return function (a, b) {
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

    function filterChange(filters) {
      applyFilters(filters);
      updateResultCount();
      initScrollableItems();
    }

    function applyFilters(filters) {
      let filteredPackages = $scope.packages;
      filters.forEach(filter => {
        const regExp = new RegExp(filter.value, 'i');
        if (filter.id === 'name') {
          filteredPackages = filteredPackages.filter(package => regExp.test(package.Name));
        } else if (filter.id === 'version') {
          filteredPackages = filteredPackages.filter(package => regExp.test(package.Version));
        } else if (filter.id === 'exporting-bundle') {
          filteredPackages = filteredPackages.filter(package => package.ExportingBundles.some(bundle => regExp.test(bundle.SymbolicName)));
        } else if (filter.id === 'importing-bundle') {
          filteredPackages = filteredPackages.filter(package => package.ImportingBundles.some(bundle => regExp.test(bundle.SymbolicName)));
        }
      });
      $scope.filteredPackages = filteredPackages;
    }

    function updateResultCount() {
      $scope.toolbarConfig.filterConfig.resultsCount = $scope.filteredPackages.length;
    }

    function initScrollableItems() {
      $scope.scrollablePackages = $scope.filteredPackages.slice(0, INFINITE_SCROLL_INITIAL_SIZE);
    }

    function loadTableContents() {
      var mbean = getSelectionPackageMBean(workspace);
      if (mbean) {
        var jolokia = workspace.jolokia;
        // bundles first:
        jolokia.request({
          type: 'exec',
          mbean: mbean,
          operation: 'listPackages'
        }, {
          success: populateTable,
          error: (response) => {
            log.debug('Osgi.PackagesController.loadTableContents() failed: ' + response.error);
          }
        });
      }
    }

    loadTableContents();

  }]);
}
