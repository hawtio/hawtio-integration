/// <reference path="jobs.component.ts"/>

namespace Quartz {

  export const jobsModule = angular
    .module('hawtio-quartz-jobs', [])
    .component('quartzJobs', jobsComponent)
    .name;

}
