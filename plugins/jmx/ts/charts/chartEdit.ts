/// <reference path="../jmx.module.ts"/>

namespace Jmx {

  jmxModule.controller("Jmx.ChartEditController", ["$scope", "$location", "workspace", "jolokia", ($scope, $location, workspace:Workspace, jolokia) => {
    $scope.selectedAttributes = [];
    $scope.selectedAttributesBackup = [];
    $scope.selectedMBeans = [];
    $scope.selectedMBeansBackup = [];
    $scope.metrics = {};
    $scope.mbeans = {};

    // TODO move this function to $routeScope
    $scope.size = (value) => {
      if (angular.isObject(value)) {
        return _.keys(value).length;
      } else if (angular.isArray(value)) {
        return value.length;
      } else return 1;
    };

    $scope.canViewChart = () => {
      return $scope.selectedAttributes.length && $scope.selectedMBeans.length &&
              $scope.size($scope.mbeans) > 0 && $scope.size($scope.metrics) > 0;
    };

    $scope.canEditChart = () => {
      // Similar to can view chart, although rules are slightly different for parents
      var result;
      if (workspace.selection && workspace.selection.isFolder()) {
        // For ENTESB-4165. This is a bit hacky but needed to deal with special conditions like
        // where there is only a single queue or topic
        result = $scope.selectedAttributes.length && $scope.selectedMBeans.length &&
          ($scope.size($scope.mbeans) + $scope.size($scope.metrics) >= 2);
      } else {
        result = $scope.selectedAttributes.length && $scope.selectedMBeans.length &&
          $scope.size($scope.mbeans) > 0 && $scope.size($scope.metrics) > 0;
      }
      return result;
    };

    $scope.showAttributes = () => {
      return $scope.canViewChart() && $scope.size($scope.metrics) > 1;
    };

    $scope.showElements = () => {
      return $scope.canViewChart() && $scope.size($scope.mbeans) > 1;
    };

    $scope.onSelectedMBeansChange = () => {
      // hack to avoid having an empty array of mbeans
      if ($scope.selectedMBeans.length === 0) {
        $scope.selectedMBeans = $scope.selectedMBeansBackup;
      } else {
        $scope.selectedMBeansBackup = $scope.selectedMBeans;
      }
    }

    $scope.onSelectedAttributesChange = () => {
      // hack to avoid having an empty array of attributes
      if ($scope.selectedAttributes.length === 0) {
        $scope.selectedAttributes = $scope.selectedAttributesBackup;
      } else {
        $scope.selectedAttributesBackup = $scope.selectedAttributes;
      }
    }

    $scope.viewChart = () => {
      // lets add the attributes and mbeans into the URL so we can navigate back to the charts view
      var search = $location.search();
      search["att"] = $scope.selectedAttributes;
      // if we are on an mbean with no children lets discard an unnecessary parameter
      if (!workspace.selection.isFolder() && $scope.selectedMBeans.length === $scope.size($scope.mbeans) && $scope.size($scope.mbeans) === 1) {
        delete search["el"];
      } else {
        search["el"] = $scope.selectedMBeans;
      }
      search['sub-tab'] = 'jmx-chart';
      $location.search(search);
      $location.path($location.path().replace('/charts/edit', '/charts'));
    };

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(render, 50);
    });

    function render() {
      var node = workspace.selection;
      if (!angular.isDefined(node) || node === null) {
        return;
      }

      $scope.selectedAttributes = [];
      $scope.selectedMBeans = [];
      $scope.metrics = {};
      $scope.mbeans = {};
      var mbeanCounter = 0;
      var resultCounter = 0;

      // lets iterate through all the children if the current node is not an mbean
      var children = node.children;
      if (!children || !children.length || node.objectName) {
        children = [node];
      }
      if (children) {
        children.forEach((mbeanNode) => {
          var mbean = mbeanNode.objectName;
          var name = mbeanNode.text;
          if (name && mbean) {
            mbeanCounter++;
            $scope.mbeans[name] = name;
            // use same logic as the JMX attributes page which works better than jolokia.list which has problems with
            // mbeans with special characters such as ? and query parameters such as Camel endpoint mbeans
            var asQuery = (node) => {
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
            jolokia.request(infoQuery, Core.onSuccess((meta) => {
              var attributes = meta.value.attr;
              if (attributes) {
                for (var key in attributes) {
                  var value = attributes[key];
                  if (value) {
                    var typeName = value['type'];
                    if (Core.isNumberTypeName(typeName)) {
                      if (!$scope.metrics[key]) {
                        //console.log("Number attribute " + key + " for " + mbean);
                        $scope.metrics[key] = key;
                      }
                    }
                  }
                }
                if (++resultCounter >= mbeanCounter) {
                  // TODO do we need to sort just in case?

                  // lets look in the search URI to default the selections
                  var search = $location.search();
                  var attributeNames = Core.toSearchArgumentArray(search["att"]);
                  var elementNames = Core.toSearchArgumentArray(search["el"]);
                  if (attributeNames && attributeNames.length) {
                    attributeNames.forEach((name) => {
                      if ($scope.metrics[name] && !_.some($scope.selectedAttributes, el => el === name)) {
                        $scope.selectedAttributes.push(name);
                      }
                    });
                  }
                  if (elementNames && elementNames.length) {
                    elementNames.forEach((name) => {
                      if ($scope.mbeans[name] && !_.some($scope.selectedAttributes, el => el === name)) {
                        $scope.selectedMBeans.push(name);
                      }
                    });
                  }

                  // default selections if there are none
                  if ($scope.selectedMBeans.length < 1) {
                    $scope.selectedMBeans = _.keys($scope.mbeans);
                  }

                  if ($scope.selectedAttributes.length < 1) {
                    var attrKeys = _.keys($scope.metrics).sort();
                    if ($scope.selectedMBeans.length > 1) {
                      $scope.selectedAttributes = [_.first(attrKeys)];
                    } else {
                      $scope.selectedAttributes = attrKeys;
                    }
                  }

                  // lets update the sizes using jquery as it seems AngularJS doesn't support it
                  $("#attributes").attr("size", _.keys($scope.metrics).length);
                  $("#mbeans").attr("size", _.keys($scope.mbeans).length);
                  Core.$apply($scope);

                  $scope.selectedMBeansBackup = $scope.selectedMBeans;
                  $scope.selectedAttributesBackup = $scope.selectedAttributes;
                }
              }

              // update the website
              Core.$apply($scope);
            }, {method: "post"}));
          }
        });
      }
    }
  }]);
}
