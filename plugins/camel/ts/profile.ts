/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.ProfileRouteController", ["$scope", "$location", "workspace", "jolokia", (
      $scope,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.initDone = false;
    $scope.data = [];

    var columnDefs:any[] = [
      {
        field: 'id',
        displayName: 'ID',
        cellFilter: null,
        width: "**",
        resizable: true
      },
      {
        field: 'count',
        displayName: 'Count',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'last',
        displayName: 'Last',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'delta',
        displayName: 'Delta',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'mean',
        displayName: 'Mean',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'min',
        displayName: 'Min',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'max',
        displayName: 'Max',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'total',
        displayName: 'Total',
        cellFilter: null,
        width: "*",
        resizable: true
      },
      {
        field: 'self',
        displayName: 'Self',
        cellFilter: null,
        width: "*",
        resizable: true
      }
    ];

    $scope.clearFilter = function() {
      $scope.gridOptions.filterOptions.filterText = '';
    }

    $scope.rowIcon = (id) => {
      var entry = $scope.icons[id];
      if (entry) {
        return entry.img + " " + id;
      } else {
        return id;
      }
    };

    $scope.gridOptions = {
      data: 'data',
      selectedItems: [],
      displayFooter: true,
      displaySelectionCheckbox: false,
      canSelectRows: false,
      enableSorting: false,
      columnDefs: columnDefs,
      filterOptions: {
        filterText: ''
      }
    };

    function onProfile(response) {
      var updatedData = [];

      // its xml structure so we need to parse it
      var xml = response.value;
      if (angular.isString(xml)) {

        // lets parse the XML DOM here...
        var doc = $.parseXML(xml);

        var routeMessages = $(doc).find("routeStat");

        routeMessages.each((idx, message) => {
          var messageData = {
            id: {},
            count: {},
            last: {},
            delta: {},
            mean: {},
            min: {},
            max: {},
            total: {},
            self: {}
          };

          // compare counters, as we only update if we have new data
          messageData.id = message.getAttribute("id");

          var total = 0;
          total += +message.getAttribute("exchangesCompleted");
          total += +message.getAttribute("exchangesFailed");
          messageData.count = total;
          messageData.last = message.getAttribute("lastProcessingTime");
          // delta is only avail from Camel 2.11 onwards
          var delta = message.getAttribute("deltaProcessingTime");
          if (delta) {
            messageData.delta = delta;
          } else {
            messageData.delta = 0;
          }
          messageData.mean = message.getAttribute("meanProcessingTime");
          messageData.min = message.getAttribute("minProcessingTime");
          messageData.max = message.getAttribute("maxProcessingTime");
          messageData.total = message.getAttribute("totalProcessingTime");
          messageData.self = message.getAttribute("selfProcessingTime");
          updatedData.push(messageData);
        });

        var processorMessages = $(doc).find("processorStat");

        processorMessages.each((idx, message) => {
          var messageData = {
            id: {},
            count: {},
            last: {},
            delta: {},
            mean: {},
            min: {},
            max: {},
            total: {},
            self: {}
          };

          messageData.id = message.getAttribute("id");
          var total = 0;
          total += +message.getAttribute("exchangesCompleted");
          total += +message.getAttribute("exchangesFailed");
          messageData.count = total;
          messageData.last = message.getAttribute("lastProcessingTime");
          // delta is only avail from Camel 2.11 onwards
          var delta = message.getAttribute("deltaProcessingTime");
          if (delta) {
            messageData.delta = delta;
          } else {
            messageData.delta = 0;
          }
          messageData.mean = message.getAttribute("meanProcessingTime");
          messageData.min = message.getAttribute("minProcessingTime");
          messageData.max = message.getAttribute("maxProcessingTime");
          // total time for processors is pre calculated as accumulated from Camel 2.11 onwards
          var apt = message.getAttribute("accumulatedProcessingTime");
          if (apt) {
            messageData.total = apt;
          } else {
            messageData.total = "0"
          }
          // self time for processors is their total time
          messageData.self = message.getAttribute("totalProcessingTime");

          updatedData.push(messageData);
        });
      }

      // if we do as below with the forEach then the data does not update
      // replace data with updated data
      $scope.data = updatedData;

      $scope.initDone = true;

      // ensure web page is updated
      Core.$apply($scope);
    };

    function loadData() {
      console.log("Loading Camel route profile data...");

      var selectedRouteId = getSelectedRouteId(workspace);
      var routeMBean = getSelectionRouteMBean(workspace, selectedRouteId);

      // schedule update the profile data, based on the configured interval
      if (routeMBean) {
        var query = {
          type: 'exec',
          mbean: routeMBean,
          operation: 'dumpRouteStatsAsXml(boolean,boolean)',
          arguments: [false, true]
        };
        Core.scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(onProfile, query));
      }
    }

    // load data
    loadData();
  }]);

}
