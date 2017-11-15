/// <reference path="features.component.ts"/>
/// <reference path="features.service.ts"/>

namespace Karaf {

    export const featuresModule = angular
      .module('hawtio-karaf-features', [])
      .component('features', featuresComponent)
      .service('featuresService', FeaturesService)
      .name;

  }
