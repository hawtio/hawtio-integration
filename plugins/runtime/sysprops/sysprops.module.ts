
/// <reference path="sysprops.component.ts"/>
/// <reference path="sysprops.service.ts"/>

namespace Runtime {

  export const systemPropertiesModule = angular
    .module('runtime-system-properties', [])
    .component('runtimeSystemProperties', systemPropertiesComponent)
    .service('systemPropertiesService', SystemPropertiesService)
    .name;

}
