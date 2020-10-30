/// <reference path="tree.component.ts"/>

namespace Quartz {

  export const treeModule = angular
    .module('hawtio-quartz-tree', [])
    .component('quartzTree', treeComponent)
    .name;

  export const treeElementId = '#quartztree';

}
