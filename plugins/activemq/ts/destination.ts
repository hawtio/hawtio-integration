/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

namespace ActiveMQ {
  
  _module.controller("ActiveMQ.DestinationController", ["$scope", "workspace", "$location", "jolokia", "localStorage", (
      $scope,
      workspace: Jmx.Workspace,
      $location: ng.ILocationService,
      jolokia: Jolokia.IJolokia,
      localStorage: WindowLocalStorage) => {

    var amqJmxDomain = localStorage['activemqJmxDomain'] || "org.apache.activemq";

    $scope.workspace = workspace;
    $scope.message = "";

    $scope.destinationName = "";
    $scope.destinationType = "Queue";

    $scope.createDialog = false;
    $scope.deleteDialog = false;
    $scope.purgeDialog = false;

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

    function validateDestinationName(name: string): boolean {
      return name.indexOf(":") === -1;
    }

    function isQueue(destinationType: string): boolean {
      return destinationType === "Queue";
    }

    function checkIfDestinationExists(name: string, destinationType: string): boolean {
      var answer = false;
      var destinations = isQueue(destinationType) ? retrieveQueueNames(workspace, false) : retrieveTopicNames(workspace, false);
      angular.forEach(destinations, (destination) => {
        if (name === destination) {
          answer = true;
        }
      })
      return answer;
    }

    $scope.validateAndCreateDestination = (name: string, destinationType: string) => {
      if (!validateDestinationName(name)) {
        $scope.createDialog = true;
        return;
      }
      if (checkIfDestinationExists(name, destinationType)) {
        Core.notification("error", `The ${ $scope.uncapitalisedDestinationType() } "${ name }" already exists`);
        return;
      }
      $scope.createDestination(name, destinationType);
    }

    $scope.createDestination = (name: string, destinationType: string) => {
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      name = Core.escapeHtml(name);
      if (mbean) {
        var operation;
        if (isQueue(destinationType)) {
          operation = "addQueue(java.lang.String)";
          $scope.message = `Created queue "${ name }"`;
        } else {
          operation = "addTopic(java.lang.String)";
          $scope.message = `Created topic "${ name }"`;
        }
        if (mbean) {
          jolokia.execute(mbean, operation, name, Core.onSuccess(operationSuccess));
        } else {
          Core.notification("error", "Could not find the Broker MBean!");
        }
      }
    };

    /**
     * When destination name contains "_" like "aaa_bbb", the actual name might be either
     * "aaa_bbb" or "aaa:bbb", so the actual name needs to be checked before removal.
     * @param name destination name
     */
    function restoreRealDestinationName(name: string): string {
      if (name.indexOf("_") === -1) {
        return name;
      }
      return jolokia.getAttribute(workspace.getSelectedMBeanName(), "Name", Core.onSuccess(null));
    }

    $scope.deleteDestination = () => {
      var mbean = getBrokerMBean(workspace, jolokia, amqJmxDomain);
      var selection = workspace.selection;
      var entries = selection.entries;
      if (mbean && selection && jolokia && entries) {
        var domain = selection.domain;
        var name = entries["Destination"] || entries["destinationName"] || selection.text;
        var operation;
        if (isQueue(entries["Type"] || entries["destinationType"])) {
          operation = "removeQueue(java.lang.String)";
          $scope.message = `Deleted queue "${ name }"`;
        } else {
          operation = "removeTopic(java.lang.String)";
          $scope.message = `Deleted topic "${ name }"`;
        }
        name = restoreRealDestinationName(name);
        // do not unescape name for destination deletion
        jolokia.execute(mbean, operation, name, Core.onSuccess(deleteSuccess));
      }
    };

    $scope.purgeDestination = () => {
      var mbean = workspace.getSelectedMBeanName();
      var selection = workspace.selection;
      var entries = selection.entries;
      if (mbean && selection && jolokia && entries) {
        var name = entries["Destination"] || entries["destinationName"] || selection.text;
        var operation = "purge()";
        $scope.message = `Purged queue "${ name }"`;
        // unescape should be done right before invoking jolokia
        name = _.unescape(name);
        jolokia.execute(mbean, operation, Core.onSuccess(operationSuccess));
      }
    };

    $scope.uncapitalisedDestinationType = () => {
      return $scope.destinationType.charAt(0).toLowerCase() + $scope.destinationType.substring(1);
    }

  }]);
}
