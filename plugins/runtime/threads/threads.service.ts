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

    dumpThreads(): angular.IPromise<string> {
      let dumpedThreads = "";
      return this.jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean, boolean)', true, true)
        .then(threads => {
          threads.forEach(thread => {
            thread.threadState = ThreadsService.STATE_LABELS[thread.threadState];
            thread.waitedTime = thread.waitedTime > 0 ? Core.humanizeMilliseconds(thread.waitedTime) : '';
            thread.blockedTime = thread.blockedTime > 0 ? Core.humanizeMilliseconds(thread.blockedTime) : '';
          });
          for (let i = 0; i < threads.length; i++) {
            let threadName = threads[i].threadName;
            let threadId = threads[i].threadId.toString();
            let threadPriority = threads[i].priority.toString();
            let isDaemonThread = threads[i].daemon == true ? "daemon" : "";
            let threadState = threads[i].threadState;
            let threadInfo = `"${threadName}" tid=${threadId} prio=${threadPriority} ${isDaemonThread} java.lang.Thread.State:${threadState}\n`;
            for (let j = 0; j < threads[i].stackTrace.length; j++) {
              let className = threads[i].stackTrace[j].className;
              let methodName = threads[i].stackTrace[j].methodName;
              let fileName = threads[i].stackTrace[j].fileName;
              let isNativeMethod = threads[i].stackTrace[j].nativeMethod == true ? "(Native)" : "";
              let isLineNoPositive = threads[i].stackTrace[j].lineNumber > 0 ? ":" + threads[i].stackTrace[j].lineNumber.toString() : "";
              let TraceJ = `   at ${className}.${methodName}(${fileName}${isLineNoPositive})${isNativeMethod}\n`;
              threadInfo += TraceJ;
            }
            dumpedThreads += threadInfo + "\n";
          }
          return dumpedThreads
        });
    }
  }

}
