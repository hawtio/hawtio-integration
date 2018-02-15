/// <reference path="endpoints.component.ts"/>
/// <reference path="endpoints.service.ts"/>

namespace Camel {

  export const endpointsModule = angular
    .module('hawtio-camel-endpoints', [])
    .component('endpoints', endpointsComponent)
    .service('endpointsService', EndpointsService)
    .name;

}
