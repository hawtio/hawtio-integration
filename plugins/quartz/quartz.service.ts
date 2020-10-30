namespace Quartz {

  type OnSuccessFn = (response: Jolokia.IResponse | string[]) => void;
  type OnErrorFn = (response: Jolokia.IErrorResponse) => void;

  export class QuartzService {

    constructor(
      private jolokia: Jolokia.IJolokia,
      private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getQuartzMBean(): string {
      const folder = this.getMBeanTypeFolder(jmxDomain, "QuartzScheduler");
      return Core.pathGet(folder, ["objectName"]);
    }

    private getMBeanTypeFolder(domain: string, typeName: string): Jmx.Folder {
      const mbeanTypesToDomain = this.workspace.mbeanTypesToDomain || {};
      const types = mbeanTypesToDomain[typeName] || {};
      const answer = types[domain];
      if (angular.isArray(answer) && answer.length > 0) {
        return answer[0];
      }
      return answer;
    }

    searchSchedulers(onSuccess: OnSuccessFn): void {
      this.jolokia.search("quartz:type=QuartzScheduler,*", Core.onSuccess(onSuccess));
    }

    readSchedulerName(mbean: string): string {
      const result = this.jolokia.request({
        type: "read", mbean: mbean,
        attribute: ["SchedulerName"]
      });
      return result.value["SchedulerName"];
    }

    registerRead(scope: ng.IScope, mbean: string, onSuccess: OnSuccessFn): void {
      // unregister before registering new
      this.unregister(scope);
      Core.register(this.jolokia, scope,
        [
          { type: "read", mbean: mbean }
        ],
        Core.onSuccess(onSuccess));
    }

    unregister(scope: ng.IScope): void {
      Core.unregister(this.jolokia, scope);
    }

    getTriggerState(mbean: string, args: any[]): { value: string } {
      return this.jolokia.request({
        type: "exec", mbean: mbean,
        operation: "getTriggerState", arguments: args
      });
    }

    start(mbean: string, onSuccess: OnSuccessFn): void {
      this.execute(mbean, "start", onSuccess);
    }

    standby(mbean: string, onSuccess: OnSuccessFn): void {
      this.execute(mbean, "standby", onSuccess);
    }

    private execute(mbean: string, operation: string,
      onSuccess: OnSuccessFn, options: Jolokia.IParams = {}): void {
      this.jolokia.request(
        { type: "exec", mbean: mbean, operation: operation },
        Core.onSuccess(onSuccess, options));
    }

    canPauseTrigger(mbean: string): boolean {
      return this.canExecuteOperation(mbean, "pauseTrigger");
    }

    pauseTrigger(mbean: string, args: string[], onSuccess: OnSuccessFn): void {
      this.executeWithArgs(mbean, "pauseTrigger", args, onSuccess);
    }

    canResumeTrigger(mbean: string): boolean {
      return this.canExecuteOperation(mbean, "resumeTrigger");
    }

    resumeTrigger(mbean: string, args: string[], onSuccess: OnSuccessFn): void {
      this.executeWithArgs(mbean, "resumeTrigger", args, onSuccess);
    }

    canUpdateTrigger(_mbean: string): boolean {
      return this.canExecuteOperation("hawtio:type=QuartzFacade", "updateCronTrigger")
        || this.canExecuteOperation("hawtio:type=QuartzFacade", "updateSimpleTrigger");
    }

    updateCronTrigger(args: any[], onSuccess: OnSuccessFn, onError?: OnErrorFn): void {
      this.executeWithArgs("hawtio:type=QuartzFacade", "updateCronTrigger", args,
        onSuccess, { error: onError });
    }

    updateSimpleTrigger(args: any[], onSuccess: OnSuccessFn, onError?: OnErrorFn): void {
      this.executeWithArgs("hawtio:type=QuartzFacade", "updateSimpleTrigger", args,
        onSuccess, { error: onError });
    }

    canManualTrigger(mbean: string): boolean {
      return this.canExecuteOperation(mbean, "triggerJob");
    }

    triggerJob(mbean: string, args: string[], onSuccess: OnSuccessFn, onError?: OnErrorFn): void {
      this.executeWithArgs(mbean, "triggerJob", args, onSuccess, { error: onError });
    }

    private executeWithArgs(mbean: string, operation: string, args: any[],
      onSuccess: OnSuccessFn, options: Jolokia.IParams = {}): void {
      this.jolokia.request(
        { type: "exec", mbean: mbean, operation: operation, arguments: args },
        Core.onSuccess(onSuccess, options));
    }

    enableSampledStatistics(mbean: string): void {
      this.setAttribute(mbean, "SampledStatisticsEnabled", true);
    }

    disableSampledStatistics(mbean: string): void {
      this.setAttribute(mbean, "SampledStatisticsEnabled", false);
    }

    private setAttribute(mbean: string, attribute: string, value: any): void {
      this.jolokia.setAttribute(mbean, attribute, value);
    }

    private canExecuteOperation(mbean: string, operation: string): boolean {
      return this.workspace.hasInvokeRightsForName(mbean, operation);
    }
  }

}
