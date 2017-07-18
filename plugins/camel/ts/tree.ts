
/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.TreeHeaderController", ["$scope", "$location", ($scope, $location: ng.ILocationService) => {
    // TODO: the tree should ideally be initialised synchronously
    const tree = () => (<any>$('#cameltree')).treeview(true);

    $scope.expandAll = () => tree().expandNode(tree().getNodes(), { levels: 1, silent: true });
    $scope.contractAll = () => tree().collapseNode(tree().getNodes(), { ignoreChildren: true, silent: true });

    const search = _.debounce(filter => {
      const result = tree().search(filter, {
        ignoreCase: true,
        exactMatch: false,
        revealResults: true
      });
      $scope.result.length = 0;
      $scope.result.push(...result);
      Core.$apply($scope);
    }, 300, { leading: false, trailing: true });

    $scope.filter = '';
    $scope.result = [];
    $scope.$watch('filter', (filter, previous) => {
      if (filter !== previous) {
        search(filter);
      }
    });
  }]);

  _module.controller("Camel.TreeController", ["$scope", "$location", "$timeout", "workspace", 'jolokia',
    ($scope, $location: ng.ILocationService, $timeout: ng.ITimeoutService, workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia) => {
    $scope.treeFetched = () => workspace.treeFetched;

    $scope.$on('$routeChangeStart', () => Jmx.updateTreeSelectionFromURL($location, $('#cameltree')));

    $scope.$watch('workspace.tree', function () {
      reloadFunction();
    });

    $scope.$on('jmxTreeUpdated', function () {
      reloadFunction();
    });

    $scope.$on('jmxTreeClicked',
      (event, selection: Jmx.NodeSelection) => navigateToDefaultTab(selection));

    // TODO: the logic should ideally be factorized with that of the visible tabs
    function navigateToDefaultTab(selection: Jmx.NodeSelection) {
      let path = '/jmx/attributes';
      if (workspace.isRoutesFolder()) {
        path = '/camel/routes';
      } else if (workspace.isRoute()) {
          if (workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), 'dumpRoutesAsXml')) {
            path = '/camel/routeDiagram';
          } else {
            path = '/jmx/attributes';
          }
      } else if (workspace.selection && workspace.selection.key === 'camelContexts') {
        path = '/camel/contexts';
      } else if (isRouteNode(workspace)) {
        path = 'camel/propertiesRoute';
      } else if (workspace.isComponent()
          && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
          && workspace.hasInvokeRights(workspace.selection, 'explainComponentJson')) {
        path = '/camel/propertiesComponent';
      } else if (workspace.isEndpoint()
          && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
          && workspace.hasInvokeRights(workspace.selection, 'explainEndpointJson')) {
        path = '/camel/propertiesEndpoint';
      } else if (workspace.isDataformat()
          && Camel.isCamelVersionEQGT(2, 16, workspace, jolokia)
          && workspace.hasInvokeRights(workspace.selection, "explainDataFormatJson")) {
        path = '/camel/propertiesDataFormat';
      }
      $location.path(path);
    }

    function reloadFunction() {
      var tree = workspace.tree;
      if (tree) {
        const rootFolder = tree.findDescendant(node => node.key === 'camelContexts');
        if (rootFolder) {
          const treeElement = $('#cameltree');
          Jmx.enableTree($scope, $location, workspace, treeElement, [rootFolder]);
          updateSelectionFromURL();
        }
      }
    }

    function updateSelectionFromURL() {
      Jmx.updateTreeSelectionFromURLAndAutoSelect($location, $('#cameltree'), (first: Jmx.Folder) => {
        // use function to auto select first Camel context routes if there is only one Camel context
        const contexts = first.children;
        if (contexts && contexts.length === 1) {
          const first = contexts[0];
          const children = first.children;
          if (children && children.length) {
            const routes = children[0];
            if (routes.typeName === 'routes') {
              return routes;
            }
          }
        }
        return null;
      }, true);
    }

    $scope.$on('$destroy', () => {
      const tree = (<any>$('#cameltree')).treeview(true);
      tree.clearSearch();
      // Bootstrap tree view leaks the node elements into the data structure
      // so let's clean this up when the user leaves the view
      const cleanTreeFolder = (node: Jmx.Folder) => {
        delete node['$el'];
        if (node.nodes) node.nodes.forEach(cleanTreeFolder);
      };
      cleanTreeFolder(workspace.tree);
      // Then call the tree clean-up method
      tree.remove();
    });

    if (workspace.selection) {
      navigateToDefaultTab(workspace.selection);
    }
  }]);
}
