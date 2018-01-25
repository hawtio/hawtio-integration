/// <reference path="tree.component.ts"/>

namespace Camel {

  export const treeModule = angular
    .module('hawtio-camel-tree', [])
    .component('camelTreeHeader', treeHeaderComponent)
    .component('camelTree', treeComponent)
    .name;

    export const treeElementId = '#cameltree';
}
