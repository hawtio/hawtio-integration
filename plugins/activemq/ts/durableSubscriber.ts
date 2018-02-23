/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

namespace ActiveMQ {

  _module.controller("ActiveMQ.DurableSubscriberController", ["$scope", "$uibModal", "workspace", "jolokia", (
      $scope,
      $uibModal,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    var amqJmxDomain = localStorage['activemqJmxDomain'] || "org.apache.activemq";

    let allSubscribers = null;
    $scope.durableSubscribers = null;
    $scope.selectedSubscriber;

    $scope.createSubscriberDialog;
    $scope.deleteSubscriberDialog = new UI.Dialog();
    $scope.showSubscriberDialog;

    $scope.topicName = '';
    $scope.clientId = '';
    $scope.subscriberName = '';
    $scope.subSelector = '';

    $scope.model = {
      allSelected: false
    }

    $scope.uiModalInstance;

    const refreshAction = {
      name: 'Refresh',
      actionFn: action => loadTable()
    };

    const createAction = {
      name: 'Create',
      actionFn: action => {
        $scope.createSubscriberDialog = $uibModal.open({
          templateUrl: 'createSubscriberDialog.html',
          scope: $scope
        });
      }
    };

    const deleteAction = {
      name: 'Delete',
      actionFn: action => $scope.deleteSubscriberDialog.open(),
      isDisabled: true
    };

    $scope.toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'destinationName',
            title: 'Topic',
            placeholder: 'Filter by topic...',
            filterType: 'text'
          },
          {
            id: 'clientId',
            title: 'Client ID',
            placeholder: 'Filter by client id...',
            filterType: 'text'
          },
          {
            id: 'consumerId',
            title: 'Consumer ID',
            placeholder: 'Filter by consumer id...',
            filterType: 'text'
          },
          {
            id: 'status',
            title: 'Status',
            placeholder: 'Filter by status...',
            filterType: 'select',
            filterValues: ['Active', 'Offline']
          },

        ],
        onFilterChange: (filters: any[]) => {
          $scope.durableSubscribers = Pf.filter(allSubscribers, $scope.toolbarConfig.filterConfig);
        }
      },
      actionsConfig: {
        primaryActions: [refreshAction, createAction, deleteAction]
      },
      isTableView: true
    };

    $scope.selectAll = () => {
      $scope.durableSubscribers.forEach(subscriber => subscriber.selected = $scope.model.allSelected);
      deleteAction.isDisabled = !$scope.model.allSelected;
    };

    $scope.toggleDeleteActionDisabled = () => {
      deleteAction.isDisabled = !$scope.durableSubscribers.some(subscriber => subscriber.selected);
    }

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
        Core.notification("danger", "Could not find the Broker MBean!");
      }
    }

    $scope.deleteSubscribers = () => {
      let selectedItems = $scope.durableSubscribers.filter(subscriber => subscriber.selected);
      let requests = selectedItems.map(subscriber => ({
        type: 'exec',
        operation: 'destroy()',
        mbean: subscriber._id
      }));

      jolokia.request(requests,  Core.onSuccess(function() {
        Core.notification('success', "Operation successful");
        loadTable();
      }));
    };

    $scope.openSubscriberDialog = (subscriber) => {
      jolokia.request({type: "read", mbean: subscriber._id}, Core.onSuccess((response) => {
        $scope.selectedSubscriber = response.value;
        $scope.selectedSubscriber.Status = subscriber.status;
        $scope.showSubscriberDialog = $uibModal.open({
          templateUrl: 'showSubscriberDialog.html',
          scope: $scope
        });
      }));
    };

    $scope.topicNames = (completionText) => retrieveTopicNames(workspace, false);

    function loadTable() {
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      if (mbean) {
        allSubscribers = [];
        jolokia.request({type: "read", mbean: mbean, attribute: ["DurableTopicSubscribers"]}, Core.onSuccess( (response) => populateTable(response, "DurableTopicSubscribers", "Active")));
        jolokia.request({type: "read", mbean: mbean, attribute: ["InactiveDurableTopicSubscribers"]}, Core.onSuccess( (response) => populateTable(response, "InactiveDurableTopicSubscribers", "Offline")));
      }
    }

    function populateTable(response, attr, status) {
      var data = response.value;
      log.debug("Got data: ", data);
      allSubscribers.push.apply(allSubscribers, data[attr].map(o => {
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

      $scope.durableSubscribers = Pf.filter(allSubscribers, $scope.toolbarConfig.filterConfig);
      $scope.model.allSelected = false;

      Core.$apply($scope);
    }

    loadTable();
  }]);
}
