/// <reference path="quartz.config.ts"/>
/// <reference path="quartz.service.ts"/>
/// <reference path="scheduler/scheduler.ts"/>
/// <reference path="triggers/trigger.ts"/>
/// <reference path="jobs/job.ts"/>

namespace Quartz {

  export type Filter = { id: string, title: string, value: string };

  export class QuartzController {

    constructor(
      protected $scope: ng.IScope,
      protected $location: ng.ILocationService,
      protected quartzService: QuartzService) {
      'ngInject';
    }

    selectedSchedulerMBean: string = null;
    selectedScheduler: Scheduler = null;
    triggers: Trigger[] = [];
    jobs: Job[] = [];

    $onInit(): void {
      this.$scope.$on(Jmx.TreeEvent.NodeSelected, (_event, node) => this.selectionChanged(node));
    }

    protected clear(): void {
      this.selectedSchedulerMBean = null;
      this.selectedScheduler = null;
      this.triggers = [];
      this.jobs = [];
    }

    private selectionChanged(node: Jmx.NodeSelection): void {
      const selectedMBean = node ? node.objectName : null;
      log.debug("Selection is now:", selectedMBean);

      if (selectedMBean) {
        this.selectedSchedulerMBean = selectedMBean;

        // TODO: is there a better way to add our nid to the uri parameter?
        this.$location.search("nid", node.key);

        // if we selected a scheduler then register a callback to get its trigger data updated in-real-time
        // as the trigger has prev/next fire times that changes
        this.quartzService.registerRead(this.$scope, this.selectedSchedulerMBean,
          (response: Jolokia.IResponse) => this.renderQuartz(response));
      } else {
        this.quartzService.unregister(this.$scope);
        this.clear();
      }
    }

    private renderQuartz(response: Jolokia.IResponse): void {
      log.debug("Selected scheduler:", this.selectedScheduler);
      const scheduler = response.value;
      if (scheduler) {
        this.selectedScheduler = scheduler;
        // redraw table
        this.updateSelectedScheduler();
      }
      Core.$apply(this.$scope);
    }

    protected updateSelectedScheduler(): void {
      const scheduler = this.selectedScheduler;

      this.triggers = [];
      // grab state for all triggers which requires to call a JMX operation per trigger
      scheduler.AllTriggers.forEach(trigger => {
        this.updateTriggerState(trigger, scheduler);
        this.triggers.push(trigger);
      });

      this.onTriggersUpdated();

      this.jobs = [];
      // grab state for all triggers which requires to call a JMX operation per trigger
      this.triggers.forEach(trigger => {
        let job = scheduler.AllJobDetails[trigger.jobName];
        if (job) {
          job = job[trigger.group];
          if (job) {
            // unique id of jobs
            job.id = job.name + "/" + job.group;
            this.jobs.push(job);
          }
        }
      });

      this.onJobsUpdated();
    }

    /**
     * Grabs state for a trigger which requires to call a JMX operation
     */
    private updateTriggerState(trigger: Trigger, scheduler: Scheduler): void {
      const state = this.quartzService.getTriggerState(this.selectedSchedulerMBean, [trigger.name, trigger.group]);
      if (state) {
        trigger.state = state.value;
      } else {
        trigger.state = "unknown";
      }

      // unique id of trigger
      trigger.id = trigger.name + "/" + trigger.group;

      // grab information about the trigger from the job map, as quartz does not have the information itself
      // so we had to enrich the job map in camel-quartz to include this information
      let job = scheduler.AllJobDetails[trigger.jobName];
      if (job) {
        job = job[trigger.group];
        if (job) {
          let repeatCount;
          let repeatInterval;
          let jobDataMap = job.jobDataMap || {};
          trigger.type = jobDataMap["CamelQuartzTriggerType"];
          if (trigger.type && trigger.type == "cron") {
            trigger.expression = jobDataMap["CamelQuartzTriggerCronExpression"];
          } else if (trigger.type && trigger.type == "simple") {
            trigger.expression = "every " + jobDataMap["CamelQuartzTriggerSimpleRepeatInterval"] + " ms.";
            repeatCount = jobDataMap["CamelQuartzTriggerSimpleRepeatCounter"];
            repeatInterval = jobDataMap["CamelQuartzTriggerSimpleRepeatInterval"];
            if (repeatCount > 0) {
              trigger.expression += " (" + repeatCount + " times)";
            } else {
              trigger.expression += " (forever)"
            }
            trigger.repeatCount = repeatCount;
            trigger.repeatInterval = repeatInterval;
          } else {
            // fallback and grab from Camel endpoint if that is possible (supporting older Camel releases)
            const uri = jobDataMap["CamelQuartzEndpoint"];
            if (uri) {
              let cron = Core.getQueryParameterValue(uri, "cron");
              if (cron) {
                trigger.type = "cron";
                // replace + with space as Camel uses + as space in the cron when specifying in the uri
                cron = cron.replace(/\++/g, ' ');
                trigger.expression = cron;
              }
              repeatCount = Core.getQueryParameterValue(uri, "trigger.repeatCount");
              repeatInterval = Core.getQueryParameterValue(uri, "trigger.repeatInterval");
              if (repeatCount || repeatInterval) {
                trigger.type = "simple";
                trigger.expression = "every " + repeatInterval + " ms.";
                if (repeatCount && repeatCount > 0) {
                  trigger.expression += " (" + repeatCount + " times)";
                } else {
                  trigger.expression += " (forever)"
                }
                trigger.repeatCount = repeatCount;
                trigger.repeatInterval = repeatInterval;
              }
            }
          }
        }
      }
    }

    protected onTriggersUpdated(): void {
      // may be implemented in a sub class
    }

    protected onJobsUpdated(): void {
      // may be implemented in a sub class
    }
  }

}
