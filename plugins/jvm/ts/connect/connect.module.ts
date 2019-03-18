/// <reference path="connect.component.ts"/>
/// <reference path="connect-edit-modal.component.ts"/>
/// <reference path="connect-delete-modal.component.ts"/>
/// <reference path="connect-login.component.ts"/>
/// <reference path="connect-login-modal.component.ts"/>
/// <reference path="connect-unreachable-modal.component.ts"/>
/// <reference path="connect.service.ts"/>
/// <reference path="connection-url.filter.ts"/>

namespace JVM {

  export const connectModule = angular
    .module('hawtio-jvm-connect', [])
    .component('connect', connectComponent)
    .component('connectEditModal', connectEditModalComponent)
    .component('connectDeleteModal', connectDeleteModalComponent)
    .component('connectLogin', connectLoginComponent)
    .component('connectLoginModal', connectLoginModalComponent)
    .component('connectUnreachableModal', connectUnreachableModalComponent)
    .service('connectService', ConnectService)
    .filter('connectionUrl', ConnectionUrlFilter)
    .name;

}