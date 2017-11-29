/// <reference path="../../activemq/ts/activemqHelpers.ts"/>
/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.TraceRouteController", ["$scope", "$timeout", "workspace", "jolokia", "localStorage", "tracerStatus",
    ($scope, $timeout, workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia, localStorage: Storage, tracerStatus) => {

    const log: Logging.Logger = Logger.get("CamelTracer");
    const MESSAGES_LIMIT = 500;

    $scope.tracing = false;
    $scope.messages = [];
    $scope.message = null;
    $scope.messageIndex = -1;
    $scope.graphView = "plugins/camel/html/routeDiagram.html";

    $scope.gridOptions = Camel.createBrowseGridOptions();
    $scope.gridOptions.selectWithCheckboxOnly = false;
    $scope.gridOptions.showSelectionCheckbox = false;
    $scope.gridOptions.multiSelect = false;
    $scope.gridOptions.afterSelectionChange = onSelectionChanged;
    $scope.gridOptions.columnDefs.push({
      field: 'toNode',
      displayName: 'To Node'
    });

    $scope.startTracing = () => {
      log.info("Start tracing");
      setTracing(true);
    };

    $scope.stopTracing = () => {
      log.info("Stop tracing");
      setTracing(false);
    };

    $scope.clear = () => {
      log.debug("Clear messages");
      tracerStatus.messages = [];
      $scope.messages = [];
      if ($scope.message) {
        $scope.messageDialog.close();
      }
      Core.$apply($scope);
    };

    // TODO can we share these 2 methods from activemq browse / camel browse / came trace?
    $scope.openMessageDialog = (message, index) => {
      $scope.message = message;
      $scope.messageIndex = index;
      highlightToNode(message.toNode);
    };

    $scope.closeMessageDetails = () => {
      $scope.message = null;
      $scope.messageIndex = -1;
      highlightToNode(null);
    };

    function highlightToNode(toNode) {
      var nodes = d3.select("svg").selectAll("g .node");
      Camel.highlightSelectedNode(nodes, toNode);
    }

    $scope.changeMessage = (index) => {
      if (index >= 0 && index <= $scope.messages.length - 1 && index !== $scope.messageIndex) {
        $scope.messageIndex = index;
        $scope.message = $scope.messages[$scope.messageIndex];
        highlightToNode($scope.message.toNode);
      }
    }

    ActiveMQ.decorate($scope, onSelectionChanged);

    function reloadTracingFlag() {
      $scope.tracing = false;
      // clear any previous polls
      if (tracerStatus.jhandle != null) {
        log.debug("Unregistering jolokia handle");
        jolokia.unregister(tracerStatus.jhandle);
        tracerStatus.jhandle = null;
      }

      var mbean = getSelectionCamelTraceMBean(workspace);
      if (mbean) {
        $scope.tracing = jolokia.getAttribute(mbean, "Enabled", Core.onSuccess(null));

        if ($scope.tracing) {
          var traceMBean = mbean;
          if (traceMBean) {
            // register callback for doing live update of tracing
            if (tracerStatus.jhandle === null) {
              log.debug("Registering jolokia handle");
              tracerStatus.jhandle = jolokia.register(populateRouteMessages, {
                type: 'exec', mbean: traceMBean,
                operation: 'dumpAllTracedMessagesAsXml()',
                ignoreErrors: true,
                arguments: []
              });
            }
          }
        } else {
          tracerStatus.messages = [];
          $scope.messages = [];
        }
      }
    }

    function populateRouteMessages(response) {
      log.debug("Populating response " + response);

      // filter messages due CAMEL-7045 but in camel-core
      // see https://github.com/hawtio/hawtio/issues/292
      var selectedRouteId = getSelectedRouteId(workspace);

      var xml = response.value;
      if (angular.isString(xml)) {
        // lets parse the XML DOM here...
        var doc = $.parseXML(xml);
        var allMessages = $(doc).find("fabricTracerEventMessage");
        if (!allMessages || !allMessages.length) {
          // lets try find another element name
          allMessages = $(doc).find("backlogTracerEventMessage");
        }

        let tableScrolled = isTableScrolled();

        allMessages.each((idx, message) => {
          var routeId = $(message).find("routeId").text();
          if (routeId === selectedRouteId) {
            var messageData:any = Camel.createMessageFromXml(message);
            var toNode = $(message).find("toNode").text();
            if (toNode) {
              messageData["toNode"] = toNode;
            }
            log.debug("Adding new message to trace table with id " + messageData["id"]);
            $scope.messages.push(messageData);
          }
        });
        
        limitMessagesArray();

        // keep state of the traced messages on tracerStatus
        tracerStatus.messages = $scope.messages;
        
        if (tableScrolled) {
          scrollTable();
        }
        
        Core.$apply($scope);
      }
    }

    function limitMessagesArray() {
      // remove messages when the array reaches its limit and the user isn't looking at a message details
      if ($scope.messages.length > MESSAGES_LIMIT && $scope.message === null) {
        $scope.messages.splice(0, $scope.messages.length - MESSAGES_LIMIT);
      }
    }

    function isTableScrolled() {
      let scrollableTable = document.querySelector('.camel-trace-messages-table-body-container');
      return scrollableTable.scrollHeight - scrollableTable.scrollTop === scrollableTable.clientHeight;
    }

    function scrollTable() {
      let scrollableTable = document.querySelector('.camel-trace-messages-table-body-container');
      $timeout(() => scrollableTable.scrollTop = scrollableTable.scrollHeight - scrollableTable.clientHeight, 0);
    }

    function onSelectionChanged() {
      angular.forEach($scope.gridOptions.selectedItems, (selected) => {
        if (selected) {
          var toNode = selected["toNode"];
          if (toNode) {
            // lets highlight the node in the diagram
            var nodes = d3.select("svg").selectAll("g .node");
            Camel.highlightSelectedNode(nodes, toNode);
          }
        }
      });
    }

    function tracingChanged(response) {
      reloadTracingFlag();
      Core.$apply($scope);
    }

    function setTracing(flag:Boolean) {
      var mbean = getSelectionCamelTraceMBean(workspace);
      if (mbean) {
        // set max only supported on BacklogTracer
        // (the old fabric tracer does not support max length)
        if (_.endsWith(mbean.toString(), "BacklogTracer")) {
          var max = Camel.maximumTraceOrDebugBodyLength(localStorage);
          var streams = Camel.traceOrDebugIncludeStreams(localStorage);
          jolokia.setAttribute(mbean, "BodyMaxChars",  max);
          jolokia.setAttribute(mbean, "BodyIncludeStreams", streams);
          jolokia.setAttribute(mbean, "BodyIncludeFiles", streams);
        }
        jolokia.setAttribute(mbean, "Enabled", flag, Core.onSuccess(tracingChanged));
      }
    }

    log.info("Re-activating tracer with " + tracerStatus.messages.length + " existing messages");
    $scope.messages = tracerStatus.messages;
    $scope.tracing = tracerStatus.jhandle != null;
  }]);

}
