/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.DebugRouteController", ["$scope", "$element", "workspace", "jolokia", "localStorage", "documentBase", (
    $scope,
    $element,
    workspace: Jmx.Workspace,
    jolokia: Jolokia.IJolokia,
    localStorage: Storage,
    documentBase: string) => {

    const log: Logging.Logger = Logger.get("CamelDebugger");
    const breakpointImageUrl = UrlHelpers.join(documentBase, "/img/icons/camel/breakpoint.png");    

    // ignore the cached stuff in camel.ts as it seems to bork the node ids for some reason...
    $scope.debugging = false;
    $scope.stopped = false;
    $scope.showDebugPanel = false;
    $scope.ignoreRouteXmlNode = true;
    $scope.messages = [];
    $scope.mode = 'text';
    // always show the message details
    $scope.showMessageDetails = true;

    $scope.startDebugging = () => {
      log.info("Start debugging");
      setDebugging(true);
    };

    $scope.stopDebugging = () => {
      log.info("Stop debugging");
      setDebugging(false);
    };

    $scope.$on("camel.diagram.selectedNodeId", (event, value) => {
      $scope.selectedDiagramNodeId = value;
      updateBreakpointFlag();
    });

    $scope.$on("camel.diagram.layoutComplete", (event, value) => {
      updateBreakpointNodes();

      $($element).find("g.node").dblclick(function (n) {
        var id = this.getAttribute("data-cid");
        $scope.toggleBreakpoint(id);
      });
    });

    $scope.toggleBreakpoint = (id) => {
      log.info("Toggle breakpoint");
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean && id) {
        var method = isBreakpointSet(id) ? "removeBreakpoint" : "addBreakpoint";
        jolokia.execute(mbean, method, id, Core.onSuccess(breakpointsChanged));
      }
    };

    $scope.addBreakpoint = () => {
      log.info("Add breakpoint");
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean && $scope.selectedDiagramNodeId) {
        jolokia.execute(mbean, "addBreakpoint", $scope.selectedDiagramNodeId, Core.onSuccess(breakpointsChanged));
      }
    };

    $scope.removeBreakpoint = () => {
      log.info("Remove breakpoint");
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean && $scope.selectedDiagramNodeId) {
        jolokia.execute(mbean, "removeBreakpoint", $scope.selectedDiagramNodeId, Core.onSuccess(breakpointsChanged));
      }
    };

    $scope.removeBreakpointById = (id) => {
      log.info("Remove breakpoint");
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean) {
        jolokia.execute(mbean, "removeBreakpoint", id, Core.onSuccess(breakpointsChanged));
      }
    };

    $scope.resume = () => {
      log.info("Resume");
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean) {
        jolokia.execute(mbean, "resumeAll", Core.onSuccess(clearStoppedAndResume));
      }
    };

    $scope.suspend = () => {
      log.info("Suspend");
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean) {
        jolokia.execute(mbean, "suspendAll", Core.onSuccess(clearStoppedAndResume));
      }
    };

    $scope.step = () => {
      log.info("Step");
      var mbean = getSelectionCamelDebugMBean(workspace);
      var stepNode = getStoppedBreakpointId();
      if (mbean && stepNode) {
        jolokia.execute(mbean, "stepBreakpoint(java.lang.String)", stepNode, Core.onSuccess(clearStoppedAndResume));
      }
    };

    $scope.shouldDisableAddBreakpoint = () => {
      if (!$scope.selectedDiagramNodeId) {
        return true;
      }

      let nodes = getDiagramNodes();
      if (!nodes || nodes.length == 0) {
        return true
      }

      return nodes[0][0].getAttribute("data-cid") === $scope.selectedDiagramNodeId;
    }

    function onSelectionChanged() {
      Camel.highlightSelectedNode(getDiagramNodes(), getStoppedBreakpointId());
    }

    function reloadData() {
      $scope.debugging = false;
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean) {
        $scope.debugging = jolokia.getAttribute(mbean, "Enabled", Core.onSuccess(null));
        if ($scope.debugging) {
          jolokia.execute(mbean, "getBreakpoints", Core.onSuccess(onBreakpoints));
          // get the breakpoints...
          $scope.graphView = "plugins/camel/html/routeDiagram.html";

          Core.register(jolokia, $scope, {
            type: 'exec', mbean: mbean,
            operation: 'getDebugCounter'
          }, Core.onSuccess(onBreakpointCounter));
        } else {
          $scope.graphView = null;
          $scope.tableView = null;
        }
      }
    }

    function onBreakpointCounter(response) {
      var counter = response.value;
      if (counter && counter !== $scope.breakpointCounter) {
        $scope.breakpointCounter = counter;
        loadCurrentStack();
      }
    }

    /*
     * lets load current 'stack' of which breakpoints are active
     * and what is the current message content
     */
    function loadCurrentStack() {
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean) {
        console.log("getting suspended breakpoints!");
        jolokia.execute(mbean, "getSuspendedBreakpointNodeIds", Core.onSuccess(onSuspendedBreakpointNodeIds));
      }
    }

    function onSuspendedBreakpointNodeIds(response) {
      var mbean = getSelectionCamelDebugMBean(workspace);
      $scope.suspendedBreakpoints = response;
      $scope.stopped = response && response.length;
      $scope.showDebugPanel = !$scope.showDebugPanel ? $scope.stopped : $scope.showDebugPanel;
      var stopNodeId = getStoppedBreakpointId();
      if (mbean && stopNodeId) {
        jolokia.execute(mbean, 'dumpTracedMessagesAsXml', stopNodeId, Core.onSuccess(onMessages));
        // lets update the diagram selection to the newly stopped node
        $scope.selectedDiagramNodeId = stopNodeId;
      }
      updateBreakpointNodes();
      Core.$apply($scope);
    }

    function onMessages(response, stopNodeId) {
      log.debug("onMessage -> " + response);
      $scope.messages = [];
      if (response) {
        var xml = response;
        if (angular.isString(xml)) {
          // lets parse the XML DOM here...
          var doc = $.parseXML(xml);
          var allMessages = $(doc).find("fabricTracerEventMessage");
          if (!allMessages || !allMessages.length) {
            // lets try find another element name
            allMessages = $(doc).find("backlogTracerEventMessage");
          }

          allMessages.each((idx, message) => {
            var messageData: any = Camel.createMessageFromXml(message);
            var toNode = $(message).find("toNode").text();
            if (toNode) {
              messageData["toNode"] = toNode;
            }
            // attach the open dialog to make it work
            messageData.openMessageDialog = $scope.openMessageDialog;
            $scope.messages.push(messageData);
          });
        }
      } else {
        log.warn("WARNING: dumpTracedMessagesAsXml() returned no results!")
      }

      // lets update the selection and selected row for the message detail view
      updateMessageSelection();
      updateBreakpointNodes();
      onSelectionChanged();
      log.debug("has messages " + $scope.messages.length + " selected row " + $scope.row + " index " + $scope.rowIndex);
      Core.$apply($scope);
    }

    function updateMessageSelection() {
      if ($scope.messages.length > 0) {
        $scope.row = $scope.messages[0];
        var body = $scope.row.body;
        $scope.mode = angular.isString(body) ? CodeEditor.detectTextFormat(body) : "text";
        // it may detect wrong as javascript, so use text instead
        if ("javascript" == $scope.mode) {
          $scope.mode = "text";
        }
      }
    }

    function clearStoppedAndResume() {
      $scope.row = null;
      $scope.messages = [];
      $scope.suspendedBreakpoints = [];
      $scope.stopped = false;
      updateMessageSelection();
      updateBreakpointNodes();
      onSelectionChanged();
      Core.$apply($scope);
    }

    /*
     * Return the current node id we are stopped at
     */
    function getStoppedBreakpointId() {
      var stepNode = null;
      var stepNodes = $scope.suspendedBreakpoints;
      if (stepNodes && stepNodes.length) {
        stepNode = stepNodes[0];
        if (stepNodes.length > 1 && $scope.isSuspendedAt($scope.selectedDiagramNodeId)) {
          // TODO should consider we stepping from different nodes based on the call thread or selection?
          stepNode = $scope.selectedDiagramNodeId;
        }
      }
      return stepNode;
    }

    /*
     * Returns true if the execution is currently suspended at the given node
     */
    $scope.isSuspendedAt = (nodeId) => containsNodeId($scope.suspendedBreakpoints, nodeId);

    function onBreakpoints(response) {
      $scope.breakpoints = response;
      updateBreakpointFlag();

      // update the breakpoint borders...
      var nodes = getDiagramNodes();
      if (nodes.length) {
        updateBreakpointNodes(nodes);
      }
      Core.$apply($scope);
    }

    /*
     * Returns true if there is a breakpoint set at the given node id
     */
    function isBreakpointSet(nodeId) {
      return containsNodeId($scope.breakpoints, nodeId);
    }

    function updateBreakpointFlag() {
      $scope.hasBreakpoint = isBreakpointSet($scope.selectedDiagramNodeId)
    }

    function containsNodeId(breakpoints, nodeId) {
      return nodeId && breakpoints && breakpoints.indexOf(nodeId) !== -1;
    }

    function getDiagramNodes() {
      var svg = d3.select("svg");
      return svg.selectAll("g .node");
    }

    function updateBreakpointNodes(nodes = getDiagramNodes()) {
      nodes.each(function (object) {
        var nodeId = object.cid;
        var thisNode = d3.select(this);
        let icons = thisNode.selectAll("image.breakpoint");
        
        if (isBreakpointSet(nodeId)) {
          if (!icons.length || !icons[0].length) {
            thisNode.append("image")
              .attr("xlink:href", function (d) {
                return breakpointImageUrl;
              })
              .attr("class", "breakpoint")
              .attr("x", d => -(d.bbox.width / 2) - 6)
              .attr("y", -20)
              .attr("height", 12)
              .attr("width", 12);
          } else {
            icons.attr("xlink:href", function (d) {
              return breakpointImageUrl;
            });
          }
        } else {
          icons.remove();
        }

        thisNode.classed('stopped', $scope.isSuspendedAt(nodeId));
      });
    }

    function breakpointsChanged(response) {
      reloadData();
      Core.$apply($scope);
    }

    function setDebugging(flag: Boolean) {
      var mbean = getSelectionCamelDebugMBean(workspace);
      if (mbean) {
        var method = flag ? "enableDebugger" : "disableDebugger";
        var max = Camel.maximumTraceOrDebugBodyLength(localStorage);
        var streams = Camel.traceOrDebugIncludeStreams(localStorage);
        jolokia.setAttribute(mbean, "BodyMaxChars", max);
        jolokia.setAttribute(mbean, "BodyIncludeStreams", streams);
        jolokia.setAttribute(mbean, "BodyIncludeFiles", streams);
        jolokia.execute(mbean, method, Core.onSuccess(breakpointsChanged));
      }
    }
  }]);
}
