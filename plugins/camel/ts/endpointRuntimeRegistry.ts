/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.EndpointRuntimeRegistryController", ["$scope", "$location", "workspace", "jolokia", (
      $scope,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.data = [];
    $scope.selectedMBean = null;

    $scope.mbeanAttributes = {};

    var columnDefs:any[] = [
      {
        field: 'url',
        displayName: 'URL'
      },
      {
        field: 'routeId',
        displayName: 'Route ID'
      },
      {
        field: 'direction',
        displayName: 'Direction'
      },
      {
        field: 'static',
        displayName: 'Static'
      },
      {
        field: 'dynamic',
        displayName: 'Dynamic'
      },
      {
        field: 'hits',
        displayName: 'Hits'
      }
    ];

    $scope.gridOptions = {
      data: 'data',
      displayFooter: true,
      displaySelectionCheckbox: false,
      canSelectRows: false,
      enableSorting: true,
      columnDefs: columnDefs,
      selectedItems: [],
      filterOptions: {
        filterText: ''
      },
      primaryKeyFn: entity => entity.routeId
    };

    function onRestRegistry(response) {
      var obj = response.value;
      if (obj) {

        // the JMX tabular data has 2 indexes so we need to dive 2 levels down to grab the data
        var arr = [];
        for (var key in obj) {
          var entry = obj[key];
          arr.push(
            {
              url: entry.url,
              routeId: entry.routeId,
              direction: entry.direction,
              static: entry.static,
              dynamic: entry.dynamic,
              hits: entry.hits
            }
          );
        }

        arr = _.sortBy(arr, "url");
        $scope.data = arr;

        // okay we have the data then set the selected mbean which allows UI to display data
        $scope.selectedMBean = response.request.mbean;

      } else {

        // set the mbean to a value so the ui can get updated
        $scope.selectedMBean = "true";
      }

      // ensure web page is updated
      Core.$apply($scope);
    }

    $scope.renderIcon = (state) => {
      return Camel.iconClass(state);
    }

    function loadEndpointRegistry() {
      console.log("Loading EndpointRuntimeRegistry data...");
      var mbean = getSelectionCamelEndpointRuntimeRegistry(workspace);
      if (mbean) {
        jolokia.request({type: 'exec', mbean: mbean, operation: 'endpointStatistics'}, Core.onSuccess(onRestRegistry));
      }
    }

    // load data
    loadEndpointRegistry();
  }]);

}
