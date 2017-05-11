/// <reference path="contexts.component.ts"/>
/// <reference path="context-toobar.component.ts"/>
/// <reference path="contexts.service.ts"/>

namespace Camel {

  angular
    .module('hawtio-camel-contexts', [])
    .component('contexts', contextsComponent)
    .component('contextToolbar', contextToolbarComponent)
    .service('contextsService', ContextsService);

}
