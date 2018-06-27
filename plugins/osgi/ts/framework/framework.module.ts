/// <reference path="framework.component.ts"/>
/// <reference path="framework.service.ts"/>

namespace Osgi {

  export const frameworkModule = angular
    .module('hawtio-osgi-framework', [])
    .component('framework', frameworkComponent)
    .service('frameworkService', FrameworkService)
    .name;
}
