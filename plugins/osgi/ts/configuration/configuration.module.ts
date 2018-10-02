/// <reference path="configuration-property-add-modal.component.ts"/>
/// <reference path="configuration-property-delete-modal.component.ts"/>
/// <reference path="configuration-property-edit-modal.component.ts"/>
/// <reference path="configuration.component.ts"/>
/// <reference path="configuration.service.ts"/>

namespace Osgi {

  export const configurationModule = angular
    .module('hawtio-osgi-configuration', [])
    .component('osgiConfiguration', configurationComponent)
    .component('configurationPropertyAddModal', configurationPropertyAddModal)
    .component('configurationPropertyDeleteModal', configurationPropertyDeleteModal)
    .component('configurationPropertyEditModal', configurationPropertyEditModal)
    .service('configurationService', ConfigurationService)
    .name;

}
