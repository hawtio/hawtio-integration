/// <reference path="operations.component.ts"/>
/// <reference path="operation-form.component.ts"/>
/// <reference path="operations.service.ts"/>

namespace Jmx {

  export const operationsModule = angular
    .module('hawtio-jmx-operations', [])
    .component('operations', operationsComponent)
    .component('operationForm', operationFormComponent)
    .service('operationsService', OperationsService)
    .name;

}
