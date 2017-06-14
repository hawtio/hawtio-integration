/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.RestServicesController", ["$scope", "$location", "workspace", "jolokia", (
      $scope,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.data = [];
    $scope.selectedMBean = null;

    $scope.mbeanAttributes = {};

    var columnDefs:any[] = [
      {
        field: 'routeId',
        displayName: 'Route ID'
      },
      {
        field: 'url',
        displayName: 'URL'
      },
      // {
      //   field: 'baseUrl',
      //   displayName: 'Base Url'
      // },
      // {
      //   field: 'basePath',
      //   displayName: 'Base Path'
      // },
      // {
      //   field: 'uriTemplate',
      //   displayName: 'Uri Template'
      // },
      {
        field: 'method',
        displayName: 'Method'
      },
      {
        field: 'consumes',
        displayName: 'Consumes'
      },
      {
        field: 'produces',
        displayName: 'Produces'
      },
      // {
      //   field: 'inType',
      //   displayName: 'Input Type'
      // },
      // {
      //   field: 'outType',
      //   displayName: 'Output Type'
      // },
      // {
      //   field: 'state',
      //   displayName: 'State'
      // },
      // {
      //   field: 'description',
      //   displayName: 'Description'
      // }
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
          var values = obj[key];
          for (var v in values) {
            var entry = values[v];
            arr.push(
              {
                url: entry.url,
                // baseUrl: entry.baseUrl,
                // basePath: entry.basePath,
                // uriTemplate: entry.uriTemplate,
                method: entry.method ? entry.method.toUpperCase() : '',
                consumes: entry.consumes,
                produces: entry.produces,
                // inType: entry.inType,
                // outType: entry.outType,
                // state: entry.state,
                routeId: entry.routeId,
                // description: entry.description
              }
            );
          }
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

    function loadRestRegistry() {
      console.log("Loading RestRegistry data...");
      var mbean = getSelectionCamelRestRegistry(workspace);
      if (mbean) {
        jolokia.request({type: 'exec', mbean: mbean, operation: 'listRestServices'}, Core.onSuccess(onRestRegistry));
      }
    }

    // load data
    loadRestRegistry();
  }]);

}
