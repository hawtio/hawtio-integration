/// <reference path="../jmx.module.ts"/>

namespace Jmx {

  jmxModule.controller("Jmx.ChartController", ["$scope", "$element", "$location", "workspace", "localStorage", "jolokiaUrl", "jolokiaParams", ($scope, $element, $location, workspace:Workspace, localStorage, jolokiaUrl, jolokiaParams) => {

    $scope.title = workspace.selection ? workspace.selection.text : '';
    $scope.metrics = [];
    $scope.updateRate = 1000; //parseInt(localStorage['updateRate']);

    $scope.context = null;
    $scope.jolokia = null;
    $scope.charts = null;

    $scope.edit = () => $location.path($location.path().replace('/charts', '/charts/edit'));

    $scope.reset = () => {
      if ($scope.context) {
        $scope.context.stop();
        $scope.context = null;
      }
      if ($scope.jolokia) {
        $scope.jolokia.stop();
        $scope.jolokia = null;
      }
      if ($scope.charts) {
        $scope.charts.empty();
        $scope.charts = null;
      }
    };

    $scope.$on('$destroy', function () {
      try {
        $scope.deregRouteChange();
      } catch (error) {
        // ignore
      }
      try {
        $scope.dereg();
      } catch (error) {
        // ignore
      }
      $scope.reset();

    });

    $scope.errorMessage = () => {
      if ($scope.updateRate === 0) {
        return "updateRate";
      }

      if ($scope.metrics.length === 0) {
        return "metrics";
      }
    };

    var doRender:()=>any = _.debounce(render, 200, { trailing: true} );

    $scope.deregRouteChange = $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      doRender();
    });

    doRender();

    function render() {
      var node = workspace.selection || workspace.getSelectedMBean();
      if (node == null) {
        return;
      }

      if (!angular.isDefined(node) || !angular.isDefined($scope.updateRate) || $scope.updateRate === 0) {
        // Called render too early, let's retry
        setTimeout(doRender, 500);
        Core.$apply($scope);
        return;
      }
      var width = 594;
      var charts = $element.find('#charts');
      if (charts) {
        width = charts.width();
      } else {
        // Called render too early, let's retry
        setTimeout(doRender, 500);
        Core.$apply($scope);
        return;
      }

      // clear out any existing context
      $scope.reset();

      $scope.charts = charts;
      $scope.jolokia = new Jolokia(jolokiaParams);
      $scope.jolokia.start($scope.updateRate);

      var mbean = node.objectName;
      $scope.metrics = [];

      var context = cubism.context()
              .serverDelay($scope.updateRate)
              .clientDelay($scope.updateRate)
              .step($scope.updateRate)
              .size(width);

      var horizon = context.horizon();
      horizon.height(40);
      horizon.colors(["#6a96c3", "#83b4d7", "#a6cee6", "#d7e7f0", "#d5eed1", "#abdbac", "#83c798", "#66a780"]);

      $scope.context = context;
      $scope.jolokiaContext = context.jolokia($scope.jolokia);
      var search = $location.search();
      var attributeNames = Core.toSearchArgumentArray(search["att"]);

      if (mbean) {
        // TODO make generic as we can cache them; they rarely ever change
        // lets get the attributes for this mbean

        // use same logic as the JMX attributes page which works better than jolokia.list which has problems with
        // mbeans with special characters such as ? and query parameters such as Camel endpoint mbeans
        var asQuery = (node) => {
          // we need to escape the mbean path for list
          var path = Core.escapeMBeanPath(node);
          var query = {
            type: "list",
            path: path,
            ignoreErrors: true
          };
          return query;
        };
        var infoQuery = asQuery(mbean);

        // must use post, so see further below where we pass in {method: "post"}
        var meta = $scope.jolokia.request(infoQuery, {method: "post"});
        if (meta) {
          // in case of error then use the default error handler
          Core.defaultJolokiaErrorHandler(meta, {});
          var attributes = meta.value ? meta.value.attr : null;
          if (attributes) {
            var foundNames = [];
            for (var key in attributes) {
              var value = attributes[key];
              if (value) {
                var typeName = value['type'];
                if (Core.isNumberTypeName(typeName)) {
                  foundNames.push(key);
                }
              }
            }

            // lets filter the attributes
            // if we find none then the att search attribute is invalid
            // so lets discard the filter - as it must be for some other mbean
            if (attributeNames.length) {
              var filtered = foundNames.filter((key) => attributeNames.indexOf(key) >= 0);
              if (filtered.length) {
                foundNames = filtered;
              }
            }

            // sort the names
            foundNames = foundNames.sort();

            angular.forEach(foundNames, (key) => {
              var metric = $scope.jolokiaContext.metric({
                type: 'read',
                mbean: mbean,
                attribute: key
              }, Core.humanizeValue(key));
              if (metric) {
                $scope.metrics.push(metric);
              }
            });
          }
        }
      } else {
        // lets try pull out the attributes and elements from the URI and use those to chart
        var elementNames = Core.toSearchArgumentArray(search["el"]);
        if (attributeNames && attributeNames.length && elementNames && elementNames.length) {

          // first lets map the element names to mbean names to keep the URI small
          var mbeans = {};
          elementNames.forEach((elementName) => {
            var child = node.get(elementName);
            if (!child && node.children) {
              child = <any>_.find(node.children, n => elementName === n["title"]);
            }
            if (child) {
              var mbean = child.objectName;
              if (mbean) {
                mbeans[elementName] = mbean;
              }
            }
          });

          // sort the names
          attributeNames = attributeNames.sort();

          // lets create the metrics
          attributeNames.forEach((key) => {
            angular.forEach(mbeans, (mbean, name) => {
              var attributeTitle = Core.humanizeValue(key);
              // for now lets always be verbose
              var title = name + ": " + attributeTitle;

              var metric = $scope.jolokiaContext.metric({
                type: 'read',
                mbean: mbean,
                attribute: key
              }, title);
              if (metric) {
                $scope.metrics.push(metric);
              }
            });
          });
        }
        // if we've children and none of the query arguments matched any metrics
        // lets redirect back to the edit view
        if (node.children.length && !$scope.metrics.length) {
          // lets forward to the chart selection UI if we have some children; they may have
          // chartable attributes
          $location.path($location.path().replace('/charts', '/charts/edit'));
        }
      }

      if ($scope.metrics.length > 0) {

        var d3Selection = d3.select(charts.get(0));
        var axisEl = d3Selection.selectAll(".axis");

        var bail = false;

        axisEl.data(["top", "bottom"])
                .enter().append("div")
                .attr("class", function (d) {
                  return d + " axis";
                })
                .each(function (d) {
                  if (bail) {
                    return;
                  }
                  try {
                    d3.select(this).call(context.axis().ticks(12).orient(d));
                  } catch (error) {
                    // still rendering at not the right time...
                    log.debug("error:", error);
                    if (!bail) {
                      bail = true;
                    }
                  }
                });

        if (bail) {
          $scope.reset();
          setTimeout(doRender, 500);
          Core.$apply($scope);
          return;
        }

        d3Selection.append("div")
                .attr("class", "rule")
                .call(context.rule());

        context.on("focus", function (i) {
          try {
            d3Selection.selectAll(".value").style("right", i === null ? null : context.size() - i + "px");
          } catch (error) {
            log.info("error:", error);
          }
        });

        $scope.metrics.forEach((metric) => {
          d3Selection.call(function (div) {
            div.append("div")
                    .data([metric])
                    .attr("class", "horizon")
                    .call(horizon);
          });
        });

      } else {
        $scope.reset();
      }

      Core.$apply($scope);

    };

  }]);
}
