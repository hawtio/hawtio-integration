/// <reference path="properties-component.controller.ts"/>
/// <reference path="properties-dataformat.controller.ts"/>
/// <reference path="properties-endpoint.controller.ts"/>
/// <reference path="properties-route.controller.ts"/>
/// <reference path="properties.service.ts"/>
/// <reference path="property-list.component.ts"/>

namespace Camel {

  export const propertiesModule = angular
  .module('hawtio-camel-properties', [])
  .controller("Camel.PropertiesComponentController", PropertiesComponentController)
  .controller("Camel.PropertiesDataFormatController", PropertiesDataFormatController)
  .controller("Camel.PropertiesEndpointController", PropertiesEndpointController)
  .controller("Camel.PropertiesRouteController", PropertiesRouteController)
  .service('propertiesService', PropertiesService)
  .component('propertyList', propertyListComponent)
  .name;

}
