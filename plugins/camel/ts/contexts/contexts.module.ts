/// <reference path="contexts.component.ts"/>
/// <reference path="context-actions.component.ts"/>
/// <reference path="contexts.service.ts"/>

namespace Camel {

  export const contextsModule = angular
    .module('hawtio-camel-contexts', [])
    .component('contexts', contextsComponent)
    .component('contextActions', contextActionsComponent)
    .service('contextsService', ContextsService)
    .name;

}
