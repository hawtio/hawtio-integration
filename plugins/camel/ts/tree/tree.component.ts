/// <reference path="tree.controller.ts"/>
/// <reference path="tree-header.controller.ts"/>

namespace Camel {

  export const treeHeaderComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/camel/html/tree/header.html',
    controller: TreeHeaderController,
  };

  export const treeComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/camel/html/tree/content.html',
    controller: TreeController,
  };
}