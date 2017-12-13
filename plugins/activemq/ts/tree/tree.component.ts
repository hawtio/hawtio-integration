/// <reference path="tree.controller.ts"/>

namespace ActiveMQ {

  export const treeHeaderComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/activemq/html/tree/header.html',
    controller: TreeHeaderController,
  };

  export const treeComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/activemq/html/tree/content.html',
    controller: TreeController,
  };
}
