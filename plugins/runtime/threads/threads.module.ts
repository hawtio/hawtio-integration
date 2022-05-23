/// <reference path="threads.component.ts"/>
/// <reference path="thread-modal.component.ts"/>
/// <reference path="threads.service.ts"/>
/// <reference path= "thread-dump-modal.component.ts"/>

namespace Runtime {

  export const threadsModule = angular
    .module('runtime-threads', [])
    .component('runtimeThreads', threadsComponent)
    .component('threadModal', threadModalComponent)
    .component('threadDumpModal', threadDumpModalComponent)
    .service('threadsService', ThreadsService)
    .name;

}
