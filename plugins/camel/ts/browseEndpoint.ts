/// <reference path="../../activemq/ts/activemqHelpers.ts"/>
/// <reference path="camelPlugin.ts"/>

namespace Camel {

  export var BrowseEndpointController = _module.controller("Camel.BrowseEndpointController", ["$scope", "$routeParams", "workspace", "jolokia", "$uibModal", (
      $scope,
      $routeParams: angular.route.IRouteParamsService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      $uibModal) => {
    
    $scope.workspace = workspace;
    $scope.mode = 'text';
    $scope.gridOptions = Camel.createBrowseGridOptions();
    $scope.endpointUri = null;
    $scope.contextId = $routeParams["contextId"];
    $scope.endpointPath = $routeParams["endpointPath"];
    $scope.isJmxTab = !$routeParams["contextId"] || !$routeParams["endpointPath"];

    // TODO can we share these 2 methods from activemq browse / camel browse / came trace?
    $scope.openMessageDialog = (message) => {
      ActiveMQ.selectCurrentMessage(message, "id", $scope);
      if ($scope.row) {
        $scope.mode = CodeEditor.detectTextFormat($scope.row.body);
        $uibModal.open({
          templateUrl: 'camelBrowseEndpointMessageDetails.html',
          scope: $scope,
          size: 'lg'
        });
      }
    };

    $scope.openForwardDialog = (message) => {
      $uibModal.open({
        templateUrl: 'camelBrowseEndpointForwardMessage.html',
        scope: $scope
      });
    };

    ActiveMQ.decorate($scope);

    $scope.forwardMessages = (uri) => {
      var mbean = getSelectionCamelContextMBean(workspace);
      var selectedItems = $scope.gridOptions.selectedItems;
      if (mbean && uri && selectedItems && selectedItems.length) {
        //console.log("Creating a new endpoint called: " + uri + " just in case!");
        jolokia.execute(mbean, "createEndpoint(java.lang.String)", uri, Core.onSuccess(intermediateResult));

        $scope.message = "Forwarded " + Core.maybePlural(selectedItems.length, "message" + " to " + uri);
        angular.forEach(selectedItems, (item, idx) => {
          var callback = (idx + 1 < selectedItems.length) ? intermediateResult : operationSuccess;
          var body = item.body;
          var headers = item.headers;
          //console.log("sending to uri " + uri + " headers: " + JSON.stringify(headers) + " body: " + body);
          jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)", uri, body, headers, Core.onSuccess(callback));
        });
      }
      $scope.endpointUri = null;
    };

    $scope.forwardMessage = (message, uri) => {
      var mbean = getSelectionCamelContextMBean(workspace);
      if (mbean && message && uri) {
        jolokia.execute(mbean, "createEndpoint(java.lang.String)", uri, Core.onSuccess(function() {
          jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)",
            uri, message.body, message.headers, Core.onSuccess(function() {
              Core.notification("success", "Forwarded message to " + uri);
              setTimeout(loadData, 50);
            }));
        }));
      }
    };

    $scope.endpointUris = () => {
      var endpointFolder = Camel.getSelectionCamelContextEndpoints(workspace);
      return (endpointFolder) ? endpointFolder.children.map(n => n.text) : [];
    };

    $scope.refresh = loadData;

    function intermediateResult() {
    }

    function operationSuccess() {
      $scope.gridOptions.selectedItems.splice(0);
      Core.notification("success", $scope.message);
      setTimeout(loadData, 50);
    }

    function loadData() {
      var mbean: string = null;
      if ($scope.contextId && $scope.endpointPath) {
        var node = workspace.findMBeanWithProperties(Camel.jmxDomain, {
          context: $scope.contextId,
          type: "endpoints",
          name: $scope.endpointPath
        });
        if (node) {
          mbean = node.objectName;
        }
      }
      if (!mbean) {
        mbean = workspace.getSelectedMBeanName();
      }
      if (mbean) {
        log.info("MBean: " + mbean);
        var options = Core.onSuccess(populateTable);
        jolokia.execute(mbean, 'browseAllMessagesAsXml(java.lang.Boolean)', true, options);
      }
    }

    function populateTable(response) {
      var data = [];
      if (angular.isString(response)) {
        // lets parse the XML DOM here...
        var doc = $.parseXML(response);
        var allMessages = $(doc).find("message");

        allMessages.each((idx, message) => {
          var messageData:any = Camel.createMessageFromXml(message);
          // attach the open dialog to make it work
          messageData.openMessageDialog = $scope.openMessageDialog;
          data.push(messageData);
        });
      }
      $scope.messages = data;
      Core.$apply($scope);
    }
  }]);
}
