/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export var ServiceController = _module.controller("Osgi.ServiceController", ["$scope", "$filter", "workspace",
    "$templateCache", "$compile", ($scope, $filter: ng.IFilterService, workspace: Jmx.Workspace,
    $templateCache: ng.ITemplateCacheService, $compile: ng.IAttributes) => {

    $scope.services = null;
    $scope.filteredServices = [];
    
    $scope.toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'objectClass',
            title: 'Object Class',
            placeholder: 'Filter by object class...',
            filterType: 'text'
          },
          {
            id: 'bundleId',
            title: 'Bundle ID',
            placeholder: 'Filter by bundle ID...',
            filterType: 'text'
          },
          {
            id: 'usingBundle',
            title: 'Using Bundle',
            placeholder: 'Filter by using bundle...',
            filterType: 'text'
          }
        ],
        resultsCount: 0,
        totalCount: 0,
        appliedFilters: [],
        onFilterChange: filters => {
          applyFilters(filters);
          updateResultCount();
        }
      }
    };

    function applyFilters(filters) {
      let filteredServices = $scope.services;
      filters.forEach(filter => {
        const regExp = new RegExp(filter.value, 'i');
        if (filter.id === 'objectClass') {
          filteredServices = filteredServices.filter(service => service.objectClass.some(clazz => regExp.test(clazz)));
        } else if (filter.id === 'bundleId') {
          filteredServices = filteredServices.filter(service => service.BundleIdentifier.toString() === filter.value);
        } else if (filter.id === 'usingBundle') {
          filteredServices = filteredServices.filter(service => service.UsingBundles.some(bundle => regExp.test(bundle.SymbolicName)));
        }
      });
      $scope.filteredServices = filteredServices;
    }

    function updateResultCount() {
      $scope.toolbarConfig.filterConfig.resultsCount = $scope.filteredServices.length;
    }
    
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
        $scope.toolbarConfig.filterConfig.totalCount = servicesArray.length;
        
        applyFilters($scope.toolbarConfig.filterConfig.appliedFilters);
        updateResultCount(); 

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
