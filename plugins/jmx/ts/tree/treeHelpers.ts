/// <reference path="folder.ts"/>
/// <reference path="../workspace.ts"/>

namespace Jmx {

  export function findLazyLoadingFunction(workspace: Workspace, folder): (workspace: Workspace, folder: Folder, onComplete: (children: NodeSelection[]) => void) => void {
    var factories = workspace.jmxTreeLazyLoadRegistry[folder.domain];
    var lazyFunction = null;
    if (factories && factories.length) {
      angular.forEach(factories, (customLoader) => {
        if (!lazyFunction) {
          lazyFunction = customLoader(folder);
        }
      });
    }
    return lazyFunction;
  }

  export function registerLazyLoadHandler(domain: string, lazyLoaderFactory: (folder: Folder) => any) {
    var array = Core.lazyLoaders[domain];
    if (!array) {
      array = [];
      Core.lazyLoaders[domain] = array;
    }
    array.push(lazyLoaderFactory);
  }

  export function unregisterLazyLoadHandler(domain: string, lazyLoaderFactory: (folder: Folder) => any) {
    if (Core.lazyLoaders) {
      var array = Core.lazyLoaders[domain];
      if (array) {
        array.remove(lazyLoaderFactory);
      }
    }
  }

  export function updateTreeSelectionFromURL($location, treeElement, activateIfNoneSelected = false) {
    updateTreeSelectionFromURLAndAutoSelect($location, treeElement, null, activateIfNoneSelected);
  }

  export function updateTreeSelectionFromURLAndAutoSelect($location, treeElement, autoSelect: (Folder) => NodeSelection, activateIfNoneSelected = false) {
    const tree = treeElement.treeview(true);
    let node: NodeSelection;

    // If there is a node id then select that one
    var key = $location.search()['nid'];
    if (key) {
      node = _.find(tree.getNodes(), { id: key }) as Folder;
    }

    // Else optionally select the first node if there is no selection
    if (!node && activateIfNoneSelected && tree.getSelected().length === 0) {
      const children = tree.getNodes() as Folder[];
      if (children.length > 0) {
        node = children[0];
        // invoke any auto select function, and use its result as new first, if any returned
        if (autoSelect) {
          var result = autoSelect(node);
          if (result) {
            node = result;
          }
        }
      }
    }

    // Finally update the tree with the result node
    if (node) {
      tree.revealNode(node, { silent: true });
      tree.selectNode(node, { silent: false });
      tree.expandNode(node, { levels: 1, silent: true });
    }

    // Word-around to avoid collapsed parent node on re-parenting
    tree.getExpanded().forEach(node => tree.revealNode(node, { silent: true }));
  }

  export function getUniqueTypeNames(children: NodeSelection[]) {
    var typeNameMap = {};
    angular.forEach(children, (mbean) => {
      var typeName = mbean.typeName;
      if (typeName) {
        typeNameMap[typeName] = mbean;
      }
    });
    // only query if all the typenames are the same
    return Object.keys(typeNameMap);
  }

  export function enableTree($scope, $location: ng.ILocationService, workspace: Workspace, treeElement, children: Array<NodeSelection>) {
    treeElement.treeview({
      lazyLoad: function (node: Folder, addNodes: (nodes: NodeSelection[]) => void) {
        const plugin = Jmx.findLazyLoadingFunction(workspace, node) as (workspace: Workspace, folder: Folder, onComplete: (children: NodeSelection[]) => void) => void;
        if (plugin) {
          log.debug('Lazy loading folder', node.text);
          plugin(workspace, node, children => addNodes(children));
        }
        // It seems to be required, as the lazyLoad property deletion done
        // by the treeview component does not seem to work
        node.lazyLoad = false;
      },
      onNodeSelected: function (event, node: Folder) {
        // We need to clear any selected node state that may leave outside
        // this tree element sub-graph so that the current selection is
        // correctly taken into account when leaving for a wider tree graph,
        // like when leaving the ActiveMQ or Camel trees to go to the JMX tree.
        const clearSelection = n => {
          if (n.state && n.id !== node.id) {
            n.state.selected = false;
          }
          if (n.children) {
            n.children.forEach(clearSelection);
          }
        };
        clearSelection(workspace.tree);
        // Expand one level down
        // Lazy loaded node are automatically expanded once the children get added
        if (!node.lazyLoad) {
          treeElement.treeview('expandNode', [node, { levels: 1, silent: true }]);
        }
        // Update the workspace state
        // The treeview component clones the node passed with the event
        // so let's lookup the original one
        const selection = treeElement.treeview('getSelected')[0] as NodeSelection;
        workspace.updateSelectionNode(selection);
        Core.$apply($scope);
      },
      levels: 1,
      data: children,
      collapseIcon: 'fa fa-angle-down',
      expandIcon: 'fa fa-angle-right',
      nodeIcon: 'pficon pficon-folder-close',
      showImage: true,
      highlightSearchResults: true,
      searchResultColor: '#b58100', // pf-gold-500
      searchResultBackColor: '#fbeabc', // pf-gold-100
      preventUnselect: true
    });
  }
}
