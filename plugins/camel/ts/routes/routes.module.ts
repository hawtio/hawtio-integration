/// <reference path="../../../includes.ts"/>
/// <reference path="routes.component.ts"/>
/// <reference path="route-toobar.component.ts"/>
/// <reference path="routes.service.ts"/>

namespace Camel {

  angular
    .module('hawtio-camel-routes', [])
    .component('routes', routesComponent)
    .component('routeToolbar', routeToolbarComponent)
    .service('routesService', RoutesService);

}
