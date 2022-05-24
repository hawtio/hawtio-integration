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
            const threadName = Core.escapeHtml(threads[i].threadName);
            const threadId = threads[i].threadId;
            const threadPriority = threads[i].priority.toString();
            const isDaemonThread = threads[i].daemon == true ? "daemon" : "";
            const threadState = threads[i].threadState;
            let threadInfo = `"${threadName}" tid=${threadId} prio=${threadPriority} ${isDaemonThread} java.lang.Thread.State:${threadState}\n`;
            for (let j = 0; j < threads[i].stackTrace.length; j++) {
              const className = threads[i].stackTrace[j].className;
              const methodName = threads[i].stackTrace[j].methodName;
              const fileName = threads[i].stackTrace[j].fileName;
              const isNativeMethod = threads[i].stackTrace[j].nativeMethod == true ? "(Native)" : "";
              const isLineNoPositive = threads[i].stackTrace[j].lineNumber > 0 ? ":" + threads[i].stackTrace[j].lineNumber : "";
              const traceJ = `   at ${className}.${methodName}(${fileName}${isLineNoPositive})${isNativeMethod}\n`;
              threadInfo += traceJ;
            }
            dumpedThreads += threadInfo + "\n";
          }
          return dumpedThreads
        });
    }
  }

}
