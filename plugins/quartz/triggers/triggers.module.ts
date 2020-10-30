/// <reference path="triggers.component.ts"/>

namespace Quartz {

  export const triggersModule = angular
    .module('hawtio-quartz-triggers', [])
    .component('quartzTriggers', triggersComponent)
    .name;

}
