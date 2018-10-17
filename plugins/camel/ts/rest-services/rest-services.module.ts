/// <reference path="rest-services.component.ts"/>
/// <reference path="rest-services.service.ts"/>

namespace Camel {

  export const restServicesModule = angular
    .module('hawtio-camel-rest-services', [])
    .component('restServices', restServicesComponent)
    .service('restServicesService', RestServicesService)
    .name;

}
