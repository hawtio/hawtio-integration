/// <reference path="activemqPlugin.ts"/>
namespace ActiveMQ {

  _module.controller("ActiveMQ.QueuesController", ["$scope", "workspace", "jolokia", "localStorage", (
    $scope,
    workspace: Jmx.Workspace,
    jolokia: Jolokia.IJolokia,
    localStorage: Storage) => {

    let amqJmxDomain = localStorage['activemqJmxDomain'] || "org.apache.activemq";

    $scope.workspace = workspace;

    $scope.destinationType;

    let allDestinations = [];
    $scope.destinations = [];

    $scope.totalServerItems = 0;

    const refreshAction = {
      name: 'Refresh',
      actionFn: action => $scope.loadTable()
    };

    $scope.toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'name',
            title: 'Name',
            placeholder: 'Filter by name...',
            filterType: 'text'
          }
        ],
        onFilterChange: (filters: any[]) => {
          $scope.destinations = Pf.filter(allDestinations, $scope.toolbarConfig.filterConfig);
        }
      },
      actionsConfig: {
        primaryActions: [refreshAction]
      },
      isTableView: true
    };

    $scope.tableConfig = {
      selectionMatchProp: 'name',
      showCheckboxes: false
    };

    $scope.pageConfig = {
      pageSize: 20,
      pageNumber: 1
    };

    if ($scope.destinationType == 'topics') {
      $scope.tableColumns = [
        { header: 'Name', itemField: 'name' },
        { header: 'Producer Count', itemField: 'producerCount' },
        { header: 'Consumer Count', itemField: 'consumerCount' },
        { header: 'Enqueue Count', itemField: 'enqueueCount' },
        { header: 'Dequeue Count', itemField: 'dequeueCount' }
        ];
    } else {
      $scope.tableColumns = [
        { header: 'Name', itemField: 'name', templateFn: value => `<a href="activemq/browseQueue?main-tab=activemq&queueName=${value}">${value}</a>` },
        { header: 'Queue Size', itemField: 'queueSize' },
        { header: 'Producer Count', itemField: 'producerCount' },
        { header: 'Consumer Count', itemField: 'consumerCount' },
        { header: 'Enqueue Count', itemField: 'enqueueCount' },
        { header: 'Dequeue Count', itemField: 'dequeueCount' },
        { header: 'Dispatch Count', itemField: 'dispatchCount' },
      ];
    }

    $scope.refresh = function() {
      $scope.loadTable();
    };

    $scope.loadTable = function() {
      let mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      if (mbean) {
        let method = 'queryQueues(java.lang.String, int, int)';
        if ($scope.destinationType == 'topics') {
          method = 'queryTopics(java.lang.String, int, int)';
        }

        let destinationFilter = {
          name: '',
          filter: ''
        };

        let appliedFilters: any[] = $scope.toolbarConfig.filterConfig.appliedFilters;
        if (appliedFilters && appliedFilters.length > 0) {
          destinationFilter['filter'] = $scope.toolbarConfig.filterConfig.appliedFilters[0].value;
        }

        jolokia.request(
          {type: 'exec', mbean: mbean, operation: method, arguments: [JSON.stringify(destinationFilter), $scope.pageConfig.pageNumber, $scope.pageConfig.pageSize]},
          Core.onSuccess(populateTable, {error: onError}));
      }
    };

    function onError() {
      Core.notification("danger", "The feature is not available in this broker version!")
      $scope.workspace.selectParentNode();
    }

    function populateTable(response) {
      let data = JSON.parse(response.value);
      $scope.destinations = [];
      angular.forEach(data["data"], (value, idx) => {
          $scope.destinations.push(value);
      });
      $scope.totalServerItems = data["count"];

      allDestinations = $scope.destinations;
      $scope.destinations = Pf.filter(allDestinations, $scope.toolbarConfig.filterConfig);

      Core.$apply($scope);
    }

    $scope.loadTable();
  }]);
}
