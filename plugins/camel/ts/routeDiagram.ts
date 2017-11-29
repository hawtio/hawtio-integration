/// <reference path="camelPlugin.ts"/>
/// <reference path="routeDiagramHelpers.ts"/>

namespace Camel {

  _module.controller("Camel.RouteController", ["$scope", "$routeParams", "$element", "$timeout", "workspace", "$location", "jolokia", "localStorage", (
      $scope,
      $routeParams: angular.route.IRouteParamsService,
      $element,
      $timeout: ng.ITimeoutService,
      workspace: Jmx.Workspace,
      $location: ng.ILocationService,
      jolokia: Jolokia.IJolokia,
      localStorage: Storage) => {

    var log: Logging.Logger = Logger.get("Camel");

    $scope.routes = [];
    $scope.routeNodes = {};

    // if we are in dashboard then $routeParams may be null
    if ($routeParams != null) {
      $scope.contextId = $routeParams["contextId"];
      $scope.routeId = Core.trimQuotes($routeParams["routeId"]);
      $scope.isJmxTab = !$routeParams["contextId"] || !$routeParams["routeId"];
    }

    $scope.camelIgnoreIdForLabel = Camel.ignoreIdForLabel(localStorage);
    $scope.camelMaximumLabelWidth = Camel.maximumLabelWidth(localStorage);
    $scope.camelShowInflightCounter = Camel.showInflightCounter(localStorage);

    const updateRoutes = _.debounce(doUpdateRoutes, 300, { trailing: true});

    // lets delay a little updating the routes to avoid timing issues where we've not yet
    // fully loaded the workspace and/or the XML model
    const delayUpdatingRoutes = 300;

    $scope.$on('jmxTreeUpdated', function () {
      updateRoutes();
    });

    $scope.$watch('nodeXmlNode', function () {
      if ($scope.isJmxTab && workspace.moveIfViewInvalid()) return;
      updateRoutes();
    });

    function doUpdateRoutes() {
      var routeXmlNode = null;
      if (!$scope.ignoreRouteXmlNode) {
        routeXmlNode = getSelectedRouteNode(workspace);
        if (!routeXmlNode) {
          routeXmlNode = $scope.nodeXmlNode;
        }
        if (routeXmlNode && routeXmlNode.localName !== "route") {
          var wrapper = document.createElement("route");
          wrapper.appendChild(routeXmlNode.cloneNode(true));
          routeXmlNode = wrapper;
        }
      }
      $scope.mbean = getSelectionCamelContextMBean(workspace);
      if (!$scope.mbean && $scope.contextId) {
        $scope.mbean = getCamelContextMBean(workspace, $scope.contextId)
      }
      if (routeXmlNode) {
        // lets show the remaining parts of the diagram of this route node
        $scope.nodes = {};
        var nodes = [];
        var links = [];
        Camel.addRouteXmlChildren($scope, routeXmlNode, nodes, links, null, 0, 0);
        showGraph(nodes, links);
      } else if ($scope.mbean) {
        jolokia.request(
                {type: 'exec', mbean: $scope.mbean, operation: 'dumpRoutesAsXml()'},
                Core.onSuccess(populateTable));
      } else {
        log.info("No camel context bean! Selection: " + workspace.selection);
      }
    }

    var populateTable = function (response) {
      var data = response.value;
      // routes is the xml data of the routes
      $scope.routes = data;
      // nodes and routeNodes is the GUI nodes for the processors and routes shown in the diagram
      $scope.nodes = {};
      $scope.routeNodes = {};
      var nodes = [];
      var links = [];
      var selectedRouteId = $scope.routeId;
      if (!selectedRouteId) {
        selectedRouteId = getSelectedRouteId(workspace);
      }
      if (data) {
        var doc = $.parseXML(data);
        Camel.loadRouteXmlNodes($scope, doc, selectedRouteId, nodes, links, $element.width());
        showGraph(nodes, links);
      } else {
        console.log("No data from route XML!")
      }
      Core.$apply($scope);
    };

    var postfix = " selected";

    function isSelected(node) {
      if (node) {
        var className = node.getAttribute("class");
        return className && _.endsWith(className, postfix);
      }
      return false;
    }

    function setSelected(node, flag) {
      var answer = false;
      if (node) {
        var className = node.getAttribute("class");
        var selected = className && _.endsWith(className, postfix);
        if (selected) {
          className = className.substring(0, className.length - postfix.length);
        } else {
          if (!flag) {
            // no need to change!
            return answer;
          }
          className = className + postfix;
          answer = true;
        }
        node.setAttribute("class", className);
      }
      return answer;
    }

    function onClickGraphNode(node) {
      log.debug("Clicked on Camel Route Diagram node: " + node.cid);
      if (workspace.isRoutesFolder()) {
        // Handle nodes selection from a diagram displaying multiple routes
        handleGraphNode(node);
      } else {
        updateRouteProperties(node, workspace.selection);
      }
    };

    function navigateToNodeProperties(cid) {
      $location.path('/camel/propertiesRoute').search({'main-tab': 'camel', 'nid': cid});
      Core.$apply($scope);
    }

    function handleGraphNode(node) {
      var cid = node.cid;
      var routes = $scope.routes;
      if (routes) {
        var route = null;

        // Find the route associated with the node that was clicked on the diagram
        var doc = $.parseXML(routes);
        route = $(doc).find("#" + cid).parents("route") || $(doc).find("[uri='" + cid + "']").parents("route");

        // Fallback on using rid if no matching route was found
        if ((!route || !route.length) && node.rid) {
          route = $(doc).find("[id='" + node.rid + "']");
        }

        if (route && route.length) {
          var routeFolder = null;
          angular.forEach(workspace.selection.children, (c) => {
            if (c.text === route[0].id) {
              routeFolder = c;
            }
          });

          if (routeFolder) {
            // Populate route folder child nodes for the context tree
            if (!routeFolder.children || !routeFolder.children.length) {
              // Ideally, we want to trigger lazy loading via node expansion
              // though there is no callback to hook into to update the view
              const plugin = <(workspace: Jmx.Workspace, folder: Jmx.Folder, onComplete: (children: Jmx.NodeSelection[]) => void) => void>Jmx.findLazyLoadingFunction(workspace, routeFolder);
              if (plugin) {
                const tree = (<any>$('#cameltree')).treeview(true);
                plugin(workspace, routeFolder, children => {
                  tree.addNode(children, routeFolder, { silent: true });
                  updateRouteProperties(node, routeFolder);
                });
              }
              // We've forced lazy loading so let's turn it off
              routeFolder.lazyLoad = false;
            } else {
              updateRouteProperties(node, routeFolder);
            }
          }
        } else {
          log.debug("No route found for " + cid);
        }
      }
    }

    function updateRouteProperties(node, routeFolder: Jmx.NodeSelection) {
      var cid = node.cid;

      // Get the 'real' cid of the selected diagram node
      var routeChild = routeFolder.findDescendant(child => {
        var uri = node.uri;
        if (uri && uri.indexOf('?') > 0) {
          uri = uri.substring(0, uri.indexOf('?'))
        }
        return child.text === node.cid || ((<any>child).routeXmlNode && (<any>child).routeXmlNode.nodeName === node.type && child.text === uri);
      });
      if (routeChild) {
        cid = routeChild.key;
      }

      navigateToNodeProperties(cid);
    }

    function showGraph(nodes, links) {
      var canvasDiv = $element;
      var svg = canvasDiv.children("svg")[0];

      // do not allow clicking on node to show properties if debugging or tracing as that is for selecting the node instead
      var onClick;
      var path = $location.path();
      if (_.startsWith(path, "/camel/debugRoute") || _.startsWith(path, "/camel/traceRoute")) {
        onClick = null;
      } else {
        onClick = onClickGraphNode;
      }

      const {graph: render} = dagreLayoutGraph(nodes, links, svg, false, onClick);

      const container = d3.select(svg);

      const zoom = d3.behavior.zoom()
        .on('zoom', () => container.select('g')
        .attr('transform', `translate(${d3.event.translate}) scale(${d3.event.scale})`));

      container.call(zoom);

      // We want to have the diagram to be uniformally scaled and centered within the SVG viewport
      // TODO: set translate extent
      function viewBox() {
        // But we don't want smaller diagrams to be scaled up so we set the viewBox to
        // the diagram bounding box only for diagrams that overflow the SVG viewport,
        // so that they scale down with preserved aspect ratio
        const graph = render.graph();
        if (graph.width > canvasDiv.width() || graph.height > canvasDiv.height()) {
          container.attr('viewBox', `0 0 ${graph.width} ${graph.height}`);
          // Bound maximum scale to nominal size
          zoom.scaleExtent([1, 1 / Math.min(canvasDiv.width() / graph.width, canvasDiv.height() / graph.height)])
        } else {
          // For diagrams smaller than the SVG viewport size, we still want them to be centered
          // with the 'preserveAspectRatio' attribute set to 'xMidYMid'
          container.attr('viewBox', `${(graph.width - canvasDiv.width()) / 2} ${(graph.height - canvasDiv.height()) / 2} ${canvasDiv.width()} ${canvasDiv.height()}`);
          // Reset the zoom scale and disable scaling
          zoom.scale(1);
          zoom.scaleExtent([1, 1]);
          // TODO: smooth transitioning from scaled down state
          container.call(zoom.event);
        }
      }
      // We need to adapt the viewBox for smaller diagrams as it depends on the SVG viewport size
      const resizeViewBox = _.debounce(viewBox, 10, { leading: true, trailing: true });
      window.addEventListener('resize', resizeViewBox);
      $scope.$on('$destroy', () => window.removeEventListener('resize', resizeViewBox));
      // Lastly, we need to do it once at initialisation
      viewBox();

      // Only apply node selection behavior if debugging or tracing
      if (_.startsWith(path, "/camel/debugRoute") || _.startsWith(path, "/camel/traceRoute")) {
        var gNodes = canvasDiv.find("g.node");
        gNodes.click(function () {
          var selected = isSelected(this);

          // lets clear all selected flags
          gNodes.each((idx, element) => {
            setSelected(element, false);
          });

          var cid = null;
          if (!selected) {
            cid = this.getAttribute("data-cid");
            setSelected(this, true);
          }
          $scope.$emit("camel.diagram.selectedNodeId", cid);
          Core.$apply($scope);
        });
      }

      if ($scope.mbean) {
        Core.register(jolokia, $scope, {
          type: 'exec', mbean: $scope.mbean,
          operation: 'dumpRoutesStatsAsXml',
          arguments: [true, true]
          // the dumpRoutesStatsAsXml is not available in all Camel versions so do not barf on errors
        }, Core.onSuccess(statsCallback, {silent: true, error: false}));
      }
      $scope.$emit("camel.diagram.layoutComplete");
    }

    function statsCallback(response) {
      var data = response.value;
      if (data) {
        var doc = $.parseXML(data);

        var allStats = $(doc).find("routeStat");
        allStats.each((idx, stat) => {
          addTooltipToNode(true, stat);
        });

        var allStats = $(doc).find("processorStat");
        allStats.each((idx, stat) => {
          addTooltipToNode(false, stat);
        });

        // now lets try update the graph
        dagreUpdateGraphData();
      }

      function addTooltipToNode(isRoute, stat) {
        // we could have used a function instead of the boolean isRoute parameter (but sometimes that is easier)
        var id = stat.getAttribute("id");
        var completed = stat.getAttribute("exchangesCompleted");
        var inflight = stat.hasAttribute("exchangesInflight") ? stat.getAttribute("exchangesInflight") : 0;
        var tooltip = "";
        if (id && completed) {
          var container = isRoute ? $scope.routeNodes: $scope.nodes;
          var node = container[id];
          if (!node) {
            angular.forEach(container, (value, key) => {
              if (!node && id === value.elementId) {
                node = value;
              }
            });
          }
          if (node) {
            var total = 0 + parseInt(completed);
            var failed = stat.getAttribute("exchangesFailed");
            if (failed) {
              total += parseInt(failed);
            }
            var last = stat.getAttribute("lastProcessingTime");
            var mean = stat.getAttribute("meanProcessingTime");
            var min = stat.getAttribute("minProcessingTime");
            var max = stat.getAttribute("maxProcessingTime");
            tooltip = "total: " + total + "\ninflight:" + inflight + "\nlast: " + last + " (ms)\nmean: " + mean + " (ms)\nmin: " + min + " (ms)\nmax: " + max + " (ms)";

            node["counter"] = total;
            if ($scope.camelShowInflightCounter) {
              node["inflight"] = inflight;
            }
            var labelSummary = node["labelSummary"];
            if (labelSummary) {
              tooltip = labelSummary + "\n\n" + tooltip;
            }
            node["tooltip"] = tooltip;
          } else {
            // we are probably not showing the route for these stats
          }
        }
      }
    }
  }]);
}
