/// <reference path="contexts.component.ts"/>
/// <reference path="contexts.service.ts"/>

namespace Camel {

  angular
    .module('hawtio-camel-contexts', [])
    .component('contexts', contextsComponent)
    .service('contextsService', ContextsService);

}
