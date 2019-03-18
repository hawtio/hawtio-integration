/// <reference path="tree-header.component.ts"/>
/// <reference path="tree.component.ts"/>
/// <reference path="tree.service.ts"/>

namespace Jmx {

  export const treeModule = angular
    .module('hawtio-jmx-tree', [])
    .component('treeHeader', treeHeaderComponent)
    .component('tree', treeComponent)
    .service('treeService', TreeService)
    .name;

    export const treeElementId = '#jmxtree';
}
