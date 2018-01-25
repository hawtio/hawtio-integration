/// <reference path="../camelPlugin.ts"/>

namespace Camel {

  export class TreeHeaderController {

    filter: string = '';
    result: any[] = [];

    constructor(
      private $scope,
      private $element: JQuery) {
        'ngInject';
        // it's not possible to declare classes to the component host tag in AngularJS
        $element.addClass('tree-nav-sidebar-header');
    }

    $onInit(): void {
      this.$scope.$watch(angular.bind(this, () => this.filter),
        (filter, previous) => {
          if (filter !== previous) {
            this.search(filter);
          }
        }
      );
    }

    private search(filter: string): void {
      const doSearch = (filter: string) => {
        const result = this.tree().search(filter, {
          ignoreCase: true,
          exactMatch: false,
          revealResults: true,
        });
        this.result.length = 0;
        this.result.push(...result);
        Core.$apply(this.$scope);
      };
      _.debounce(doSearch, 300, { leading: false, trailing: true })(filter);
    }

    private tree(): any {
      return ($('#cameltree') as any).treeview(true);
    }

    expandAll(): any {
      return this.tree()
        .expandNode(this.tree().getNodes(), { levels: 1, silent: true });
    }

    contractAll(): any {
      return this.tree()
        .collapseNode(this.tree().getNodes(), { ignoreChildren: true, silent: true });
    }
  }

  export class TreeController {

    constructor(
      private $scope,
      private $location: ng.ILocationService,
      private workspace: Jmx.Workspace,
      private $route: angular.route.IRouteService,
      private jolokia: Jolokia.IJolokia,
      private $element: JQuery) {
        'ngInject';
        // it's not possible to declare classes to the component host tag in AngularJS
        $element.addClass('tree-nav-sidebar-content');
    }

    $onInit(): void {
      this.$scope.$on('$destroy', () => this.removeTree());
      this.$scope.$on('$routeChangeStart', () => Jmx.updateTreeSelectionFromURL(this.$location, $('#cameltree')));
      this.$scope.$watch(angular.bind(this, () => this.workspace.tree), () => this.populateTree());
      this.$scope.$on('jmxTreeUpdated', () => this.populateTree());
      this.$scope.$on('jmxTreeClicked',
        (event, selection: Jmx.NodeSelection) => this.navigateToDefaultTab(selection));

      if (this.workspace.selection) {
        this.navigateToDefaultTab(this.workspace.selection);
      }
    }

    treeFetched(): boolean {
      return this.workspace.treeFetched;
    }

    private updateSelectionFromURL(): void {
      Jmx.updateTreeSelectionFromURLAndAutoSelect(this.$location, $('#cameltree'), (first: Jmx.Folder) => {
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

    private populateTree(): void {
      const tree = this.workspace.tree;
      if (tree) {
        const rootFolder = tree.findDescendant(node => node.key === 'camelContexts');
        if (rootFolder) {
          this.removeTree();
          Jmx.enableTree(this.$scope, this.$location, this.workspace, $('#cameltree'), [rootFolder]);
          this.updateSelectionFromURL();
        }
      }
    }

    private removeTree(): void {
      const tree = ($('#cameltree') as any).treeview(true);
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

    // TODO: the logic should ideally be factorized with that of the visible tabs
    private navigateToDefaultTab(selection: Jmx.NodeSelection) {
      let path = '/jmx/attributes';
      if (this.workspace.isRoutesFolder()) {
        path = '/camel/routes';
      } else if (this.workspace.isRoute()) {
          if (this.workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(this.workspace), 'dumpRoutesAsXml')) {
            path = '/camel/routeDiagram';
          } else {
            path = '/jmx/attributes';
          }
      } else if (this.workspace.selection && this.workspace.selection.key === 'camelContexts') {
        path = '/camel/contexts';
      } else if (isRouteNode(this.workspace)) {
        path = 'camel/propertiesRoute';
      } else if (this.workspace.isComponent()
          && Camel.isCamelVersionEQGT(2, 15, this.workspace, this.jolokia)
          && this.workspace.hasInvokeRights(this.workspace.selection, 'explainComponentJson')) {
        path = '/camel/propertiesComponent';
      } else if (this.workspace.isEndpoint()
          && Camel.isCamelVersionEQGT(2, 15, this.workspace, this.jolokia)
          && this.workspace.hasInvokeRights(this.workspace.selection, 'explainEndpointJson')) {
        path = '/camel/propertiesEndpoint';
      } else if (this.workspace.isDataformat()
          && Camel.isCamelVersionEQGT(2, 16, this.workspace, this.jolokia)
          && this.workspace.hasInvokeRights(this.workspace.selection, "explainDataFormatJson")) {
        path = '/camel/propertiesDataFormat';
      }
      this.$location.path(path);
    }
  }
}
