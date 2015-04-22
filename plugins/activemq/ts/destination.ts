/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

module ActiveMQ {
  _module.controller("ActiveMQ.DestinationController", ["$scope", "workspace", "$location", "jolokia", ($scope, workspace:Workspace, $location, jolokia) => {
    $scope.workspace = workspace;
    $scope.message = "";
    $scope.destinationName = "";
    $scope.queueType = (isTopicsFolder(workspace) || isTopic(workspace)) ? "false" : "true";
    $scope.destinationTypeName = $scope.queueType ? "Queue" : "Topic";

    $scope.deleteDialog = false;
    $scope.purgeDialog = false;

    updateQueueType();

    function updateQueueType() {
      $scope.destinationTypeName = $scope.queueType  === "true" ? "Queue" : "Topic";
    }

    $scope.$watch('queueType', function () {
      updateQueueType();
    });

    $scope.$watch('workspace.selection', function () {
      workspace.moveIfViewInvalid();
    });

    function operationSuccess() {
      $scope.destinationName = "";
      $scope.workspace.operationCounter += 1;
      Core.notification("success", $scope.message);
      $scope.workspace.loadTree();
      Core.$apply($scope);
    }

    function deleteSuccess() {
      // lets set the selection to the parent
      workspace.removeAndSelectParentNode();
      $scope.workspace.operationCounter += 1;
      Core.notification("success", $scope.message);
      // and switch to show the attributes (table view)
      $location.path('/jmx/attributes').search({"main-tab": "activemq", "sub-tab": "activemq-attributes"});
      Core.$apply($scope);
    }

    function getBrokerMBean(jolokia) {
      var mbean = null;
      var selection = workspace.selection;
      if (selection && isBroker(workspace) && selection.objectName) {
        return selection.objectName;
      }
      var folderNames = selection.folderNames;
      //if (selection && jolokia && folderNames && folderNames.length > 1) {
      var parent = selection ? selection.parent : null;
      if (selection && parent && jolokia && folderNames && folderNames.length > 1) {
        mbean = parent.objectName;

        // we might be a destination, so lets try one more parent
        if (!mbean && parent) {
          mbean = parent.parent.objectName;
        }
        if (!mbean) {
          mbean = "" + folderNames[0] + ":BrokerName=" + folderNames[1] + ",Type=Broker";
        }
      }
      return mbean;
    }

    $scope.createDestination = (name, isQueue) => {
      var mbean = getBrokerMBean(jolokia);
      if (mbean) {
        var operation;
        if (isQueue === "true") {
          operation = "addQueue(java.lang.String)";
          $scope.message = "Created queue " + name;
        } else {
          operation = "addTopic(java.lang.String)";
          $scope.message = "Created topic " + name;
        }
        if (mbean) {
          jolokia.execute(mbean, operation, name, Core.onSuccess(operationSuccess));
        } else {
          Core.notification("error", "Could not find the Broker MBean!");
        }
      }
    };

    $scope.deleteDestination = () => {
      var mbean = getBrokerMBean(jolokia);
      var selection = workspace.selection;
      var entries = selection.entries;
      if (mbean && selection && jolokia && entries) {
        var domain = selection.domain;
        var name = entries["Destination"] || entries["destinationName"] || selection.title;
        name = name.unescapeHTML();
        var isQueue = "Topic" !== (entries["Type"] || entries["destinationType"]);
        var operation;
        if (isQueue) {
          operation = "removeQueue(java.lang.String)";
          $scope.message = "Deleted queue " + name;
        } else {
          operation = "removeTopic(java.lang.String)";
          $scope.message = "Deleted topic " + name;
        }
        jolokia.execute(mbean, operation, name, Core.onSuccess(deleteSuccess));
      }
    };

    $scope.purgeDestination = () => {
      var mbean = workspace.getSelectedMBeanName();
      var selection = workspace.selection;
      var entries = selection.entries;
      if (mbean && selection && jolokia && entries) {
        var name = entries["Destination"] || entries["destinationName"] || selection.title;
        name = name.unescapeHTML();
        var operation = "purge()";
        $scope.message = "Purged queue " + name;
        jolokia.execute(mbean, operation, Core.onSuccess(operationSuccess));
      }
    };

    $scope.name = () => {
      var selection = workspace.selection;
      if (selection) {
        return selection.title;
      }
      return null;
    }
  }]);
}
