/// <reference path="attributes.controller.ts"/>
/// <reference path="attributes.service.ts"/>

namespace Jmx {

  export const attributesModule = angular
    .module('hawtio-jmx-attributes', [])
    .controller('Jmx.AttributesController', AttributesController)
    .service('attributesService', AttributesService)
    .name;

}
