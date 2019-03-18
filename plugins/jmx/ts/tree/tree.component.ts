namespace Jmx {

  export class TreeController {

    constructor(
      private $scope,
      private $location: ng.ILocationService,
      private workspace: Workspace,
      private $element: JQuery,
      private $timeout: ng.ITimeoutService) {
      'ngInject';
      // it's not possible to declare classes to the component host tag in AngularJS
      $element.addClass('tree-nav-sidebar-content');
    }

    $onInit(): void {
      this.$scope.$on('$destroy', () => this.removeTree());
      this.$scope.$on(TreeEvent.Updated, () => this.populateTree());
      this.$scope.$on('$routeChangeStart', () => this.updateSelectionFromURL());

      this.populateTree();
    }

    updateSelectionFromURL(): void {
      updateTreeSelectionFromURL(this.$location, $(treeElementId));
    }

    private populateTree(): void {
      log.debug('TreeController: populateTree');
      this.removeTree();
      enableTree(this.$scope, this.$location, this.workspace, $(treeElementId), this.workspace.tree.children);
      this.$timeout(() => {
        this.updateSelectionFromURL();
        this.workspace.broadcastSelectionNode();
      });
    }

    private removeTree(): void {
      const tree = ($(treeElementId) as any).treeview(true);
      // There is no exposed API to check whether the tree has already been initialized,
      // so let's just check if the methods are presents
      if (tree.clearSearch) {
        tree.clearSearch();
        // Bootstrap tree view leaks the node elements into the data structure
        // so let's clean this up when the user leaves the view
        const cleanTreeFolder = (node: Folder) => {
          delete node['$el'];
          if (node.nodes) node.nodes.forEach(cleanTreeFolder);
        };
        cleanTreeFolder(this.workspace.tree);
        // Then call the tree clean-up method
        tree.remove();
      }
    }
  }

  export const treeComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/jmx/html/tree/content.html',
    controller: TreeController,
  };

}
