/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

module ActiveMQ {
  _module.controller("ActiveMQ.DestinationController", ["$scope", "workspace", "$location", "jolokia", ($scope, workspace:Workspace, $location, jolokia) => {

    var amqJmxDomain = localStorage['activemqJmxDomain'] || "org.apache.activemq";

    $scope.workspace = workspace;
    $scope.message = "";
    $scope.destinationName = "";
    $scope.destinationTypeName = $scope.queueType ? "Queue" : "Topic";

    $scope.createDialog = false;
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
      $scope.queueType = (isTopicsFolder(workspace) || isTopic(workspace)) ? "false" : "true";
      $scope.name = Core.pathGet(workspace, ['selection', 'title']);
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
      $scope.workspace.loadTree();
      Core.$apply($scope);
    }

    function validateDestinationName(name:string):boolean {
      return name.indexOf(":") == -1;
    }

    function checkIfDestinationExists(name:string, isQueue:boolean):boolean {
      var answer = false;
      var destinations = isQueue ? retrieveQueueNames(workspace, false) : retrieveTopicNames(workspace, false);
      angular.forEach(destinations, (destination) => {
        if (name === destination) {
          answer = true;
        }
      })
      return answer;
    }

    $scope.validateAndCreateDestination = (name:string, isQueue:boolean) => {
      if (!validateDestinationName(name)) {
        $scope.createDialog = true;
        return;
      }
      if (checkIfDestinationExists(name, isQueue)) {
        Core.notification("error", "The " + (isQueue ? "queue" : "topic") + " \"" + name + "\" already exists");
        return;
      }
      $scope.createDestination(name, isQueue);
    }

    $scope.createDestination = (name:string, isQueue:boolean) => {
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      name = Core.escapeHtml(name);
      if (mbean) {
        var operation;
        if (isQueue) {
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
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      var selection = workspace.selection;
      var entries = selection.entries;
      if (mbean && selection && jolokia && entries) {
        var domain = selection.domain;
        var name = entries["Destination"] || entries["destinationName"] || selection.title;
        name = _.unescape(name);
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
        name = _.unescape(name);
        var operation = "purge()";
        $scope.message = "Purged queue " + name;
        jolokia.execute(mbean, operation, Core.onSuccess(operationSuccess));
      }
    };

  }]);
}
