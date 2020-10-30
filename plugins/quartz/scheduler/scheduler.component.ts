/// <reference path="../quartz.controller.ts"/>

namespace Quartz {

  export class SchedulerController extends QuartzController {

    pauseScheduler(): void {
      if (this.selectedSchedulerMBean) {
        this.quartzService.standby(this.selectedSchedulerMBean,
          () => Core.notification("success", `Paused scheduler: ${this.selectedScheduler.SchedulerName}`)
        );
      }
    }

    startScheduler(): void {
      if (this.selectedSchedulerMBean) {
        this.quartzService.start(this.selectedSchedulerMBean,
          () => Core.notification("success", `Started scheduler: ${this.selectedScheduler.SchedulerName}`)
        );
      }
    }

    enableSampleStatistics(): void {
      if (this.selectedSchedulerMBean) {
        this.quartzService.enableSampledStatistics(this.selectedSchedulerMBean);
      }
    }

    disableSampleStatistics(): void {
      if (this.selectedSchedulerMBean) {
        this.quartzService.disableSampledStatistics(this.selectedSchedulerMBean);
      }
    }
  }

  export const schedulerComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/quartz/scheduler/scheduler.html',
    controller: SchedulerController
  };

}
