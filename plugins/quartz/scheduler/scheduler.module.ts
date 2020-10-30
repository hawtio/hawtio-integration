/// <reference path="scheduler.component.ts"/>

namespace Quartz {

  export const schedulerModule = angular
    .module('hawtio-quartz-scheduler', [])
    .component('quartzScheduler', schedulerComponent)
    .name;

}
