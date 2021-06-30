/// <reference path="../triggers/trigger.ts"/>
/// <reference path="../jobs/job.ts"/>

namespace Quartz {

  export interface Scheduler {
    AllJobDetails: { [key: string]: Job };
    AllTriggers: Trigger[];
    SchedulerName: string;
    JobGroupNames: string[];
  }

}
