/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

namespace ActiveMQ {

  _module.controller("ActiveMQ.DurableSubscriberController", ["$scope", "workspace", "jolokia", (
      $scope,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    var amqJmxDomain = localStorage['activemqJmxDomain'] || "org.apache.activemq";

    $scope.refresh = loadTable;

    $scope.durableSubscribers = [];

    $scope.tempData = [];

    $scope.createSubscriberDialog = new UI.Dialog();
    $scope.deleteSubscriberDialog = new UI.Dialog();
    $scope.showSubscriberDialog = new UI.Dialog();

    $scope.topicName = '';
    $scope.clientId = '';
    $scope.subscriberName = '';
    $scope.subSelector = '';

    $scope.gridOptions = {
      selectedItems: [],
      data: 'durableSubscribers',
      displayFooter: false,
      showFilter: false,
      showColumnMenu: true,
      enableCellSelection: false,
      enableColumnResize: true,
      enableColumnReordering: true,
      selectWithCheckboxOnly: false,
      showSelectionCheckbox: false,
      multiSelect: false,
      displaySelectionCheckbox : false, // old pre 2.0 config!
      filterOptions: {
        filterText: ''
      },
      maintainColumnRatios: false,
      columnDefs: [
        {
          field: 'destinationName',
          displayName: 'Topic',
          width: '30%'
        },
        {
          field: 'clientId',
          displayName: 'Client ID',
          width: '30%'
        },
        {
          field: 'consumerId',
          displayName: 'Consumer ID',
          cellTemplate: '<div class="ngCellText"><span ng-hide="row.entity.status != \'Offline\'">{{row.entity.consumerId}}</span><a ng-show="row.entity.status != \'Offline\'" ng-click="openSubscriberDialog(row)">{{row.entity.consumerId}}</a></div>',
          width: '30%'
        },
        {
          field: 'status',
          displayName: 'Status',
          width: '10%'
        }
      ],
      primaryKeyFn: entity => entity.destinationName + '/' + entity.clientId + '/' + entity.consumerId
    };

    $scope.doCreateSubscriber = (clientId, subscriberName, topicName, subSelector) => {
      $scope.createSubscriberDialog.close();
      $scope.clientId = clientId;
      $scope.subscriberName = subscriberName;
      $scope.topicName = topicName;
      $scope.subSelector = subSelector;
      if (Core.isBlank($scope.subSelector)) {
        $scope.subSelector = null;
      }
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      if (mbean) {
        jolokia.execute(mbean, "createDurableSubscriber(java.lang.String, java.lang.String, java.lang.String, java.lang.String)", $scope.clientId, $scope.subscriberName, $scope.topicName, $scope.subSelector, Core.onSuccess(function() {
          Core.notification('success', "Created durable subscriber " + clientId);
          $scope.clientId = '';
          $scope.subscriberName = '';
          $scope.topicName = '';
          $scope.subSelector = '';
          loadTable();
        }));
      } else {
        Core.notification("error", "Could not find the Broker MBean!");
      }
    }

    $scope.deleteSubscribers = () => {
      var mbean = $scope.gridOptions.selectedItems[0]._id;
      jolokia.execute(mbean, "destroy()",  Core.onSuccess(function() {
          $scope.showSubscriberDialog.close();
          Core.notification('success', "Deleted durable subscriber");
          loadTable();
          $scope.gridOptions.selectedItems.splice(0, $scope.gridOptions.selectedItems.length);
      }));
    };

    $scope.openSubscriberDialog = (subscriber) => {
      jolokia.request({type: "read", mbean: subscriber.entity._id}, Core.onSuccess((response) => {
        $scope.showSubscriberDialog.subscriber = response.value;
        $scope.showSubscriberDialog.subscriber.Status =  subscriber.entity.status;
        console.log("Subscriber is now " + $scope.showSubscriberDialog.subscriber);
        Core.$apply($scope);

        // now lets start opening the dialog
        setTimeout(() => {
          $scope.showSubscriberDialog.open();
          Core.$apply($scope);
        }, 100);
      }));
    };

    $scope.topicNames = (completionText) => retrieveTopicNames(workspace, false);

    function loadTable() {
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      if (mbean) {
        $scope.durableSubscribers = []
        jolokia.request({type: "read", mbean: mbean, attribute: ["DurableTopicSubscribers"]}, Core.onSuccess( (response) => populateTable(response, "DurableTopicSubscribers", "Active")));
        jolokia.request({type: "read", mbean: mbean, attribute: ["InactiveDurableTopicSubscribers"]}, Core.onSuccess( (response) => populateTable(response, "InactiveDurableTopicSubscribers", "Offline")));
      }
    }

    function populateTable(response, attr, status) {
      var data = response.value;
      log.debug("Got data: ", data);
      $scope.durableSubscribers.push.apply($scope.durableSubscribers, data[attr].map(o => {
        var objectName = o["objectName"];
        var entries = Core.objectNameProperties(objectName);
        if (!('objectName' in o)) {
          if ('canonicalName' in o) {
            objectName = o['canonicalName'];
          }
          entries = _.cloneDeep(o['keyPropertyList']);
        }

        entries["_id"] = objectName;
        entries["status"] = status;
        return entries;
      }));

      Core.$apply($scope);
    }
  }]);
}
