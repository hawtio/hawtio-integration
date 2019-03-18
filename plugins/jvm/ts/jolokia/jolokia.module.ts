/// <reference path="jolokia-params.factory.ts"/>
/// <reference path="jolokia-preferences.controller.ts"/>
/// <reference path="jolokia.service.ts"/>

namespace JVM {

  export const jolokiaModule = angular
    .module('hawtio-jvm-jolokia', [])
    .controller("JVM.JolokiaPreferences", JolokiaPreferences)
    .service("jolokiaService", JolokiaService)
    .factory('jolokiaParams', createJolokiaParams)
    .name;

}
