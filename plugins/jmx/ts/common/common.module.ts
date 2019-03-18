/// <reference path="header.component.ts"/>
/// <reference path="navigation.component.ts"/>

namespace Jmx {

  export const commonModule = angular
    .module('hawtio-jmx-common', [])
    .component('jmxHeader', headerComponent)
    .component('jmxNavigation', navigationComponent)
    .name;

}
