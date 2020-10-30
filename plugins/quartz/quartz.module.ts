/// <reference path="quartz.config.ts"/>
/// <reference path="quartz.component.ts"/>
/// <reference path="quartz.service.ts"/>
/// <reference path="tree/tree.module.ts"/>
/// <reference path="scheduler/scheduler.module.ts"/>
/// <reference path="triggers/triggers.module.ts"/>
/// <reference path="jobs/jobs.module.ts"/>

namespace Quartz {

  export const quartzModule = angular
    .module('hawtio-quartz', [
      treeModule,
      schedulerModule,
      triggersModule,
      jobsModule
    ])
    .config(configureRoutes)
    .filter('quartzIconClass', () => iconClass)
    .filter('quartzMisfire', () => misfireText)
    .run(configureLayout)
    .run(configureHelp)
    .component('quartz', quartzComponent)
    .service('quartzService', QuartzService)
    .name;

}
