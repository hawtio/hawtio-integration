/// <reference path="./thread.ts"/>

namespace Runtime {

  export class ThreadsService {

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getThreads(): angular.IPromise<Thread[]> {
      return this.jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean,boolean)', false, false)
        .then(threads => {
          threads.forEach(thread => initThread(thread));
          return threads;
        });
    }

    isThreadContentionMonitoringEnabled(): angular.IPromise<boolean> {
      return this.jolokiaService.getAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled');
    };

    enableThreadContentionMonitoring(): angular.IPromise<void> {
      return this.jolokiaService.setAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled', true);
    };

    disableThreadContentionMonitoring(): angular.IPromise<void> {
      return this.jolokiaService.setAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled', false);
    };

    dumpThreads(): angular.IPromise<string> {
      return this.jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean, boolean)', true, true)
        .then(threads => {
          let dumpedThreads = "";
          threads.forEach(thread => {
            initThread(thread);

            const name = Core.escapeHtml(thread.threadName);
            const daemon = thread.daemon ? " daemon" : "";
            let threadInfo = `"${name}" #${thread.threadId}${daemon} priority:${thread.priority} State:${thread.threadState}`;
            thread.stackTrace.forEach(st => {
              const lineNo = st.lineNumber > 0 ? ":" + st.lineNumber : "";
              const native = st.nativeMethod ? "(Native)" : "";
              threadInfo += `\n\tat ${st.className}.${st.methodName}(${st.fileName}${lineNo})${native}`;
            });
            dumpedThreads += (dumpedThreads === "" ? "" : "\n\n") + threadInfo;
          });
          return dumpedThreads;
        });
    };
  }

}
