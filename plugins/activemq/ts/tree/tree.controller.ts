/// <reference path="../activemqPlugin.ts"/>

namespace ActiveMQ {

  export class TreeController {

    constructor(
      private $scope,
      private $location: ng.ILocationService,
      private workspace: Jmx.Workspace,
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

    private updateSelectionFromURL() {
      Jmx.updateTreeSelectionFromURLAndAutoSelect(this.$location, $(treeElementId), (first: Jmx.Folder) => {
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

        this.removeTree();
        Jmx.enableTree(this.$scope, this.$location, this.workspace, $(treeElementId), children);
        this.updateSelectionFromURL();
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
