/// <reference path="./thread.ts"/>

namespace Runtime {

  export class ThreadsService {
    private static STATE_LABELS = {
      BLOCKED: 'Blocked',
      NEW: 'New',
      RUNNABLE: 'Runnable',
      TERMINATED: 'Terminated',
      TIMED_WAITING: 'Timed waiting',
      WAITING: 'Waiting'
    };

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getThreads(): angular.IPromise<Thread[]> {
      return this.jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean,boolean)', false, false)
        .then(threads => {
          threads.forEach(thread => {
            thread.threadState = ThreadsService.STATE_LABELS[thread.threadState];
            thread.waitedTime = thread.waitedTime > 0 ? Core.humanizeMilliseconds(thread.waitedTime) : '';
            thread.blockedTime = thread.blockedTime > 0 ? Core.humanizeMilliseconds(thread.blockedTime) : '';
          });
          return threads;
      });
    }

    isThreadContentionMonitoringEnabled(): angular.IPromise<boolean> {
      return this.jolokiaService.getAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled');
    }

    enableThreadContentionMonitoring(): angular.IPromise<void> {
      return this.jolokiaService.setAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled', true);
    }

    disableThreadContentionMonitoring(): angular.IPromise<void> {
      return this.jolokiaService.setAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled', false);
    }
    dumpThreads():angular.IPromise<string>  {
      let stack_traces = "";
     return this.jolokiaService.execute('java.lang:type=Threading','dumpAllThreads(boolean, boolean)',true,true)
      .then(threads => {
        threads.forEach(thread => {
          thread.threadState = ThreadsService.STATE_LABELS[thread.threadState];
          thread.waitedTime = thread.waitedTime > 0 ? Core.humanizeMilliseconds(thread.waitedTime) : '';
          thread.blockedTime = thread.blockedTime > 0 ? Core.humanizeMilliseconds(thread.blockedTime) : '';
          stack_traces+=JSON.stringify(thread.stackTrace)
        });
        return stack_traces;
    });
    }
  }

}
