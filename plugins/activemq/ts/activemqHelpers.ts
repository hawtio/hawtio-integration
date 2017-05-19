/// <reference path="../../includes.ts"/>

module ActiveMQ {

  export var pluginName: string = 'activemq';
  export var log: Logging.Logger = Logger.get("activemq");
  export var jmxDomain: string = 'org.apache.activemq';

  function findFolder(node: Jmx.NodeSelection, titles:string[], ascend:boolean): Jmx.NodeSelection {
    if (!node) {
      return null;
    }
    var answer: Jmx.NodeSelection = null;
    angular.forEach(titles, (title) => {
      if (node.text === title) {
        answer = node;
      }
    });
    if (answer === null) {
      if (ascend) {
        var parent = node.parent;
        if (parent) {
          answer = findFolder(parent, titles, ascend);
        }
      } else {
        // retrieves only one level down for children
        angular.forEach(node.children, (child) => {
          angular.forEach(titles, (title) => {
            if (child.text === title) {
              answer = node;
            }
          });
        });
      }
    }
    return answer;
  }

  export function getSelectionQueuesFolder(workspace: Jmx.Workspace, ascend: boolean): Jmx.NodeSelection {
    var selection = workspace.selection;
    if (selection) {
      return findFolder(selection, ["Queues", "Queue"], ascend);
    }
    return null;
  }

  export function retrieveQueueNames(workspace: Jmx.Workspace, ascend: boolean): string[] {
    var queuesFolder = getSelectionQueuesFolder(workspace, ascend);
    if (queuesFolder) {
      return queuesFolder.children.map(n => n.text);
    }
    return [];
  }

  export function getSelectionTopicsFolder(workspace: Jmx.Workspace, ascend: boolean): Jmx.NodeSelection {
    var selection = workspace.selection;
    if (selection) {
      return findFolder(selection, ["Topics", "Topic"], ascend);
    }
    return null;
  }

  export function retrieveTopicNames(workspace: Jmx.Workspace, ascend: boolean): string[] {
    var topicsFolder = getSelectionTopicsFolder(workspace, ascend);
    if (topicsFolder) {
      return topicsFolder.children.map(n => n.text);
    }
    return [];
  }

  /**
   * Sets $scope.row to currently selected JMS message.
   * Used in:
   *  - activemq/js/browse.ts
   *  - camel/js/browseEndpoint.ts
   *
   * TODO: remove $scope argument and operate directly on other variables. but it's too much side effects here...
   *
   * @param message
   * @param key unique key inside message that distinguishes between values
   * @param $scope
   */
  export function selectCurrentMessage(message:any, key:string, $scope) {
    // clicking on message's link would interfere with messages selected with checkboxes
    if ('selectAll' in $scope.gridOptions) {
      $scope.gridOptions.selectAll(false);
    } else {
      $scope.gridOptions.selectedItems.length = 0;
    } 
    var idx = Core.pathGet(message, ["rowIndex"]) || Core.pathGet(message, ['index']);
    var jmsMessageID = Core.pathGet(message, ["entity", key]);
    $scope.rowIndex = idx;
    var selected = $scope.gridOptions.selectedItems;
    selected.splice(0, selected.length);
    if (idx >= 0 && idx < $scope.messages.length) {
      $scope.row = $scope.messages.find((msg) => msg[key] === jmsMessageID);
      if ($scope.row) {
        selected.push($scope.row);
      }
    } else {
      $scope.row = null;
    }
  }

  /**
   * - Adds functions needed for message browsing with details
   * - Adds a watch to deselect all rows after closing the slideout with message details
   * TODO: export these functions too?
   *
   * @param $scope
   * @param fn optional function to call if the selected row was changed
   */
  export function decorate($scope, fn = null) {
    $scope.selectRowIndex = (idx) => {
      $scope.rowIndex = idx;
      var selected = $scope.gridOptions.selectedItems;
      selected.splice(0, selected.length);
      if (idx >= 0 && idx < $scope.messages.length) {
        $scope.row = $scope.messages[idx];
        if ($scope.row) {
          selected.push($scope.row);
        }
      } else {
        $scope.row = null;
      }
      if (fn) {
        fn.apply()
      }
    };

    $scope.$watch("showMessageDetails", () => {
      if (!$scope.showMessageDetails) {
        $scope.row = null;
        $scope.gridOptions.selectedItems.splice(0, $scope.gridOptions.selectedItems.length);
      }
    });
  }

  export function getBrokerMBean(workspace: Jmx.Workspace, jolokia, jmxDomain: string) {
    var mbean = null;
    var selection = workspace.selection;
    if (selection && isBroker(workspace) && selection.objectName) {
      return selection.objectName;
    }
    var folderNames = selection.folderNames;
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
  };

}
