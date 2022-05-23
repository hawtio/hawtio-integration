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
      var dumpedThreads = "";
      return this.jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean, boolean)', true, true)
        .then(threads => {
          threads.forEach(thread => {
            thread.threadState = ThreadsService.STATE_LABELS[thread.threadState];
            thread.waitedTime = thread.waitedTime > 0 ? Core.humanizeMilliseconds(thread.waitedTime) : '';
            thread.blockedTime = thread.blockedTime > 0 ? Core.humanizeMilliseconds(thread.blockedTime) : '';
          });
          for (var i = 0; i < threads.length; i++) {
            var tinfo = "";
            var isdaemon = threads[i].daemon == true ? " daemon" : "";
            tinfo += '"' + threads[i].threadName + '"' + " tid=" + threads[i].threadId.toString() + " prio=" + threads[i].priority.toString() + isdaemon + " java.lang.Thread.State:" + threads[i].threadState + "\n";
            for (var j = 0; j < threads[i].stackTrace.length; j++) {
              var isNativeMethod = threads[i].stackTrace[j].nativeMethod == true ? "(Native)" : "";
              var isLineNoPositive = threads[i].stackTrace[j].lineNumber > 0 ? ":" + threads[i].stackTrace[j].lineNumber.toString() : "";
              tinfo += "   " + "at " + threads[i].stackTrace[j].className + "." + threads[i].stackTrace[j].methodName + "(" + threads[i].stackTrace[j].fileName + isLineNoPositive + ")" + isNativeMethod + "\n";
            }
            dumpedThreads += tinfo + "\n";
          }
          return dumpedThreads
        });
    }
  }

}
