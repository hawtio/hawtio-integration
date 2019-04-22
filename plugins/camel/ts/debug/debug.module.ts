/// <reference path="add-conditional-breakpoint-modal.component.ts"/>
/// <reference path="debug.controller.ts"/>
/// <reference path="debug.service.ts"/>

namespace Camel {

  export const debugModule = angular
    .module('hawtio-camel-debug', [])
    .controller("Camel.DebugRouteController", DebugController)
    .component('addConditionalBreakpointModal', addConditionalBreakpointModal)
    .service('debugService', DebugService)
    .name;

}
