namespace Quartz {

  export interface Trigger {
    id: string;
    group: string;
    name: string;
    state: string;
    type: string;
    jobGroup: string;
    jobName: string;
    expression: string;
    cron: string;
    misfireInstruction: number;
    previousFireTime: Date;
    nextFireTime: Date;
    finalFireTime: Date;
    repeatCount: number;
    repeatInterval: number;
  }

  export interface UpdateTriggerForm {
    group: string;
    name: string;
    type: string;
    cron: string;
    misfireInstruction: string;
    repeatCount: number;
    repeatInterval: number;
    // form visibilities
    showCron: boolean;
    showRepeatCount: boolean;
    showRepeatInterval: boolean;
    misfireInstructions: { id: string, title: string }[]
  }

  export interface ManualTriggerForm {
    name: string;
    group: string;
    parameters: string;
  }

}
