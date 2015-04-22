/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>

module Camel {

  _module.controller("Camel.TreeHeaderController", ["$scope", "$location", ($scope, $location) => {

    $scope.contextFilterText = '';

    $scope.$watch('contextFilterText', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        $scope.$emit("camel-contextFilterText", newValue);
      }
    });

    $scope.expandAll = () => {
      Tree.expandAll("#cameltree");
    };

    $scope.contractAll = () => {
      Tree.contractAll("#cameltree");
    };
  }]);

  _module.controller("Camel.TreeController", ["$scope", "$location", "$timeout", "workspace", "$rootScope", ($scope,
                                 $location:ng.ILocationService,
                                 $timeout,
                                 workspace:Workspace,
                                 $rootScope) => {
    $scope.contextFilterText = $location.search()["cq"];
    $scope.fullScreenViewLink = Camel.linkToFullScreenView(workspace);

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      $timeout(updateSelectionFromURL, 50, false);
    });

    $scope.$watch('workspace.tree', function () {
      reloadFunction();
    });

    // TODO - how the tree is initialized is different, how this filter works needs to be revisited
    /*
    var reloadOnContextFilterThrottled = _.debounce(() => {
      reloadFunction(() => {
        $("#camelContextIdFilter").focus();
        Core.$apply($scope);
      });
    }, 100, { trailing: true } );

    $scope.$watch('contextFilterText', function () {
      if ($scope.contextFilterText != $scope.lastContextFilterText) {
        $timeout(reloadOnContextFilterThrottled, 250, false);
      }
    });

    $rootScope.$on('camel-contextFilterText', (event, value) => {
      $scope.contextFilterText = value;
    });
    */

    $scope.$on('jmxTreeUpdated', function () {
      reloadFunction();
    });

    function reloadFunction(afterSelectionFn = null) {
      $scope.fullScreenViewLink = Camel.linkToFullScreenView(workspace);

      var children = [];
      var domainName = Camel.jmxDomain;

      // lets pull out each context
      var tree = workspace.tree;
      if (tree) {
        var rootFolder = tree.findDescendant((node) => {
          return node.id === 'camelContexts';
        });
        if (rootFolder) {
          $timeout(() => {
            var treeElement = $("#cameltree");
            Jmx.enableTree($scope, $location, workspace, treeElement, [rootFolder], true);
            // lets do this asynchronously to avoid Error: $digest already in progress
            updateSelectionFromURL()
              if (angular.isFunction(afterSelectionFn)) {
                afterSelectionFn();
              }
          }, 10);
        }
      }
    }

    function updateSelectionFromURL() {
      Jmx.updateTreeSelectionFromURLAndAutoSelect($location, $("#cameltree"), (first) => {
        // use function to auto select first Camel context routes if there is only one Camel context
        var contexts = first.getChildren();
        if (contexts && contexts.length === 1) {
          first = contexts[0];
          first.expand(true);
          var children = first.getChildren();
          if (children && children.length) {
            var routes = children[0];
            if (routes.data.typeName === 'routes') {
              first = routes;
              //Core.$apply($scope);
              return first;
            }
          }
        }
        //Core.$apply($scope);
        return null;
      }, true);
      $scope.fullScreenViewLink = Camel.linkToFullScreenView(workspace);
    }
  }]);

}
