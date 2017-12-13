/// <reference path="tree.component.ts"/>

namespace ActiveMQ {

  export const treeModule = angular
    .module('hawtio-activemq-tree', [])
    .component('activemqTreeHeader', treeHeaderComponent)
    .component('activemqTree', treeComponent)
    .name;
}
