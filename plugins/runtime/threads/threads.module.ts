/// <reference path="threads.component.ts"/>
/// <reference path="thread-modal.component.ts"/>
/// <reference path="threads.service.ts"/>

namespace Runtime {

  export const threadsModule = angular
    .module('runtime-threads', [])
    .component('runtimeThreads', threadsComponent)
    .component('threadModal', threadModalComponent)
    .service('threadsService', ThreadsService)
    .name;

}
