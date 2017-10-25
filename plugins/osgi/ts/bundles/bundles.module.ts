/// <reference path="bundles-component.ts"/>
/// <reference path="install-bundle-component.ts"/>
/// <reference path="bundles-service.ts"/>

namespace Osgi {

  export const bundlesModule = angular
    .module('hawtio-osgi-bundles', [])
    .component('bundles', bundlesComponent)
    .component('installBundle', installBundleComponent)
    .service('bundlesService', BundlesService)
    .name;

}
