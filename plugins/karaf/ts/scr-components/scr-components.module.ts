/// <reference path="scr-components.component.ts"/>
/// <reference path="scr-component-detail.component.ts"/>
/// <reference path="scr-components.service.ts"/>

namespace Karaf {
  
    export const scrComponentsModule = angular
      .module('hawtio-karaf-scr-components', [])
      .component('scrListComponents', scrListComponent)
      .component('scrComponentDetail', scrDetailComponent)      
      .service('scrComponentsService', ScrComponentsService)
      .name;
  
  }
  