namespace Quartz {

  export interface Job {
    id: string;
    group: string;
    name: string;
    durability: boolean;
    shouldRecover: boolean;
    jobClass: string;
    description: string;
    jobDataMap: { [key: string]: string }
  }

}
