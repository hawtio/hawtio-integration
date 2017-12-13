/// <reference path="../activemqPlugin.ts"/>

namespace ActiveMQ {

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
      return ($('#activemqtree') as any).treeview(true);
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
      this.$scope.$on('$destroy', () => {
        const tree = ($('#activemqtree') as any).treeview(true);
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
      });

      this.$scope.$on('$routeChangeStart', () => Jmx.updateTreeSelectionFromURL(this.$location, $('#activemqtree')));

      this.$scope.$watch(angular.bind(this, () => this.workspace.tree), () => this.populateTree());

      this.$scope.$on('jmxTreeUpdated', () => this.populateTree());
    }

    treeFetched(): boolean {
      return this.workspace.treeFetched;
    }

    private updateSelectionFromURL() {
      Jmx.updateTreeSelectionFromURLAndAutoSelect(this.$location, $('#activemqtree'), (first: Jmx.Folder) => {
        if (first.children == null) {
          return null;
        }
        // use function to auto select the queue folder on the 1st broker
        const queues = first.children[0];
        if (queues && queues.text === 'Queue') {
          return queues;
        }
        return null;
      }, true);
    }

    private populateTree(): void {
      let children: Array<Jmx.NodeSelection> = [];
      const tree = this.workspace.tree;
      if (tree) {
        const domainName = 'org.apache.activemq';
        const folder = tree.get(domainName);
        if (folder) {
          children = folder.children;
        }
        if (children.length) {
          const firstChild = children[0];
          // the children could be AMQ 5.7 style broker name folder with the actual MBean in the children
          // along with folders for the Queues etc...
          if (!firstChild.typeName && firstChild.children.length < 4) {
            // lets avoid the top level folder
            let answer = [];
            angular.forEach(children, (child) => {
              answer = answer.concat(child.children);
            });
            children = answer;
          }
        }

        // filter out advisory topics
        children.forEach(broker => {
          var grandChildren = broker.children;
          if (grandChildren) {
            const old = _.find(grandChildren, n => n.text === 'Topic');
            if (old) {
              // we need to store all topics the first time on the workspace
              // so we have access to them later if the user changes the filter in the preferences
              const key = "ActiveMQ-allTopics-" + broker.text;
              const allTopics = _.clone(old.children);
              this.workspace.mapData[key] = allTopics;

              const filter = Core.parseBooleanValue(localStorage['activemqFilterAdvisoryTopics']);
              if (filter) {
                if (old && old.children) {
                  const filteredTopics = _.filter(old.children, (c:any) => !_.startsWith(c.text, 'ActiveMQ.Advisory'));
                  old.children = filteredTopics;
                }
              } else if (allTopics) {
                old.children = allTopics;
              }
            }
          }
        });

        const treeElement = $('#activemqtree');
        Jmx.enableTree(this.$scope, this.$location, this.workspace, treeElement, children);
        this.updateSelectionFromURL();
      }
    }
  }
}
