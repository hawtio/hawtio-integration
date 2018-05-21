/// <reference path="features.component.ts"/>
/// <reference path="feature-repository-add-modal.component.ts"/>
/// <reference path="feature-repository-remove-modal.component.ts"/>
/// <reference path="features.service.ts"/>

namespace Karaf {

    export const featuresModule = angular
      .module('hawtio-karaf-features', [])
      .component('features', featuresComponent)
      .component('featureRepositoryAddModal', featureRepositoryAddModalComponent)
      .component('featureRepositoryRemoveModal', featureRepositoryRemoveModalComponent)
      .service('featuresService', FeaturesService)
      .name;

  }
