/// <reference path="profile.component.ts"/>
/// <reference path="profile.service.ts"/>

namespace Camel {

  export const profileModule = angular
    .module('hawtio-camel-profile', [])
    .component('profile', profileComponent)
    .service('profileService', ProfileService)
    .name;

}
