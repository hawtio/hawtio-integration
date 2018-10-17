/// <reference path="camelPlugin.ts"/>

namespace Camel {

  export var BrowseEndpointController = _module.controller("Camel.BrowseEndpointController", ["$scope",
    "$routeParams", "workspace", "jolokia", "$uibModal", ($scope, $routeParams: angular.route.IRouteParamsService,
    workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia, $uibModal) => {

    const forwardAction = {
      name: 'Forward',
      actionFn: action => {
        $uibModal.open({
          templateUrl: 'camelBrowseEndpointForwardMessage.html',
          scope: $scope
        });
      },
      isDisabled: true
    };

    const refreshAction = {
      name: 'Refresh',
      actionFn: action => loadData()
    };

    let allMessages = null;
    $scope.messages = null;
    $scope.camelContextMBean = getSelectionCamelContextMBean(workspace);
    $scope.mode = 'text';
    $scope.endpointUri = null;
    $scope.contextId = $routeParams["contextId"];
    $scope.endpointPath = $routeParams["endpointPath"];
    $scope.isJmxTab = !$routeParams["contextId"] || !$routeParams["endpointPath"];
    $scope.model = {
      allSelected: false
    }

    $scope.toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'id',
            title: 'Message ID',
            placeholder: 'Filter by message ID...',
            filterType: 'text'
          }
        ],
        onFilterChange: (filters: any[]) => {
          $scope.messages = Pf.filter(allMessages, $scope.toolbarConfig.filterConfig);
        }
      },
      actionsConfig: {
        primaryActions: [forwardAction, refreshAction]
      },
      isTableView: true
    };

    $scope.refreshForwardActionDisabledProperty = () => {
      forwardAction.isDisabled = !$scope.messages.some(message => message.selected);
    }

    $scope.tableConfig = {
      selectionMatchProp: 'id',
      showCheckboxes: true
    };

    $scope.tableDtOptions = {
      order: [[1, "desc"]],
    };

    $scope.tableColumns = [
      {
        itemField: 'id',
        header: 'Message ID'
      }
    ];

    $scope.selectAll = () => {
      $scope.messages.forEach(message => message.selected = $scope.model.allSelected);
      forwardAction.isDisabled = !$scope.model.allSelected;
    };

    $scope.selectRowIndex = (rowIndex) => {
      $scope.rowIndex = rowIndex;
      $scope.row = $scope.messages[rowIndex];
    };

    $scope.openMessageDialog = (message, index) => {
      $scope.row = message;
      $scope.rowIndex = index;
      $scope.mode = CodeEditor.detectTextFormat(message.body);
      $uibModal.open({
        templateUrl: 'camelBrowseEndpointMessageDetails.html',
        scope: $scope,
        size: 'lg'
      });
    };

    $scope.forwardMessages = (uri) => {
      var mbean = getSelectionCamelContextMBean(workspace);
      var selectedMessages = $scope.messages.filter(message => message.selected);
      if (mbean && uri && selectedMessages && selectedMessages.length) {
        jolokia.execute(mbean, "createEndpoint(java.lang.String)", uri, Core.onSuccess(intermediateResult));

        $scope.message = "Forwarded " + Core.maybePlural(selectedMessages.length, "message" + " to " + uri);
        angular.forEach(selectedMessages, (item, idx) => {
          var callback = (idx + 1 < selectedMessages.length) ? intermediateResult : operationSuccess;
          var body = item.body;
          var headers = item.headers;
          jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)", uri, body, headers, Core.onSuccess(callback, {error: onError}));
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

    function intermediateResult() {
    }

    function operationSuccess() {
      Core.notification("success", $scope.message);
      setTimeout(loadData, 50);
    }

    function onError(response) {
      Core.notification("danger", "Error forwarding messages to endpoint");
      log.error(response.error);
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
        log.debug("MBean:", mbean);
        jolokia.execute(mbean, 'browseAllMessagesAsXml(java.lang.Boolean)', true,
          Core.onSuccess(populateTable));
      }
    }

    function populateTable(response) {
      var data = [];

      if (angular.isString(response)) {
        // lets parse the XML DOM here...
        var doc = $.parseXML(response);
        var docMessages = $(doc).find("message");

        const totalRows = docMessages.length;
        data.length = totalRows;

        for (let i = 0; i < totalRows; i++) {
          data[totalRows - 1 - i] = Camel.createMessageFromXml(docMessages[i]);
        }
      }

      allMessages = data;
      $scope.messages = Pf.filter(allMessages, $scope.toolbarConfig.filterConfig);
      $scope.model.allSelected = false;

      Core.$apply($scope);
    }

    loadData();
  }]);
}
