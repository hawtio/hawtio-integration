/// <reference path="../camelPlugin.ts"/>

namespace Camel {

  export class TreeController {

    constructor(
      private $scope,
      private $location: ng.ILocationService,
      private workspace: Jmx.Workspace,
      private jolokia: Jolokia.IJolokia,
      private $element: JQuery) {
        'ngInject';
        // it's not possible to declare classes to the component host tag in AngularJS
        $element.addClass('tree-nav-sidebar-content');
    }

    $onInit(): void {
      this.$scope.$on('$destroy', () => this.removeTree());
      this.$scope.$on('$routeChangeStart', () => Jmx.updateTreeSelectionFromURL(this.$location, $(treeElementId)));
      this.$scope.$on('jmxTreeUpdated', () => this.populateTree());
      this.populateTree();
    }

    private updateSelectionFromURL(): void {
      Jmx.updateTreeSelectionFromURLAndAutoSelect(this.$location, $(treeElementId), (first: Jmx.Folder) => {
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
      this.workspace.broadcastSelectionNode();
    }

    private populateTree(): void {
      const tree = this.workspace.tree;
      if (tree) {
        const rootFolder = tree.findDescendant(node => node.key === 'camelContexts');
        if (rootFolder) {
          this.removeTree();
          Jmx.enableTree(this.$scope, this.$location, this.workspace, $(treeElementId), [rootFolder]);
          this.updateSelectionFromURL();
        } else {
          // No camel contexts so redirect to the JMX view and select the first tree node
          if (tree.children && tree.children.length > 0) {
            const firstNode = tree.children[0];
            this.$location.path('/jmx/attributes').search({'nid': firstNode['id']});
          }
        }
      }
    }

    private removeTree(): void {
      const tree = ($(treeElementId) as any).treeview(true);
      // There is no exposed API to check whether the tree has already been initialized,
      // so let's just check if the methods are presents
      if (tree.clearSearch) {
        tree.clearSearch();
        // Bootstrap tree view leaks the node elements into the data structure
        // so let's clean this up when the user leaves the view
        const cleanTreeFolder = (node: Jmx.Folder) => {
          delete node['$el'];
          if (node.nodes) node.nodes.forEach(cleanTreeFolder);
        };
        cleanTreeFolder(this.workspace.tree);
        // Then call the tree clean-up method
        tree.remove();
      }
    }

  }
}
