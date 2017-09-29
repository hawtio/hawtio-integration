/// <reference path="routes.component.ts"/>
/// <reference path="route-actions.component.ts"/>
/// <reference path="routes.service.ts"/>

namespace Camel {

  export const routesModule = angular
    .module('hawtio-camel-routes', [])
    .component('routes', routesComponent)
    .component('routeActions', routeActionsComponent)
    .service('routesService', RoutesService)
    .name;

}
