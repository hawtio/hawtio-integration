/// <reference path="log-entry.ts"/>

namespace Logs {

  export class LogsService {

    constructor(private $q: ng.IQService, private jolokiaService: JVM.JolokiaService, private localStorage: Storage,
      private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getLogQueryMBean(): Jmx.Folder {
      return this.workspace.findMBeanWithProperties('hawtio', { type: 'LogQuery' });
    }

    isValid(): boolean {
      const logQueryMBean = this.getLogQueryMBean();
      return logQueryMBean && this.workspace.hasInvokeRightsForName(logQueryMBean.objectName, 'getLogResults(int)');
    }

    getInitialLogs(): ng.IPromise<any> {
      return this.getLogs('getLogResults(int)', this.getLogCacheSize());
    }

    getMoreLogs(fromTimestamp: number): ng.IPromise<LogEntry[]> {
      return this.getLogs('jsonQueryLogResults', { afterTimestamp: fromTimestamp, count: this.getLogBatchSize() });
    }

    private getLogs(operation: string, arg1: any): ng.IPromise<LogEntry[]> {
      const objectName = this.getLogQueryMBean().objectName;
      return this.jolokiaService.execute(objectName, operation, arg1)
        .then(response => {
          response.logEntries = response.events ? response.events.map(event => new LogEntry(event)) : [];
          return response;
        });
    }

    appendLogs(logs: LogEntry[], logEntries: LogEntry[]): LogEntry[] {
      logs.push(...logEntries);

      let logCacheSize = this.getLogCacheSize();
      if (logs.length > logCacheSize) {
        logs.splice(0, logs.length - logCacheSize);
      }

      return logs;
    }

    filterLogs(logs: LogEntry[], filterConfig): LogEntry[] {
      let filteredLogs = [...logs];

      filterConfig.appliedFilters.forEach(filter => {
        switch (filter.id) {
          case 'level':
            filteredLogs = filteredLogs.filter(log => log.level === filter.value)
            break;
          case 'logger':
            const regExp = new RegExp(filter.value, 'i');
            filteredLogs = filteredLogs.filter(log => regExp.test(log.logger));
            break;
          case 'message':
            filteredLogs = filteredLogs.filter(log => log.matchMessage(filter.value))
            break;
          case 'properties':
            filteredLogs = filteredLogs.filter(log => log.matchProperties(filter.value))
            break;
        }
      });

      if (!this.isLogSortAsc()) {
        filteredLogs = filteredLogs.reverse();
      }

      filterConfig.totalCount = logs.length;
      filterConfig.resultsCount = filteredLogs.length;

      return filteredLogs;
    }

    isLogSortAsc(): boolean {
      let logSortAsc = this.localStorage.getItem('logSortAsc');
      return logSortAsc !== 'false';
    }

    isLogAutoScroll(): boolean {
      let logAutoScroll = this.localStorage.getItem('logAutoScroll');
      return logAutoScroll !== 'false';
    }

    getLogCacheSize(): number {
      let logCacheSize = this.localStorage.getItem('logCacheSize');
      return logCacheSize !== null ? parseInt(logCacheSize) : 500;
    }

    getLogBatchSize(): number {
      let logBatchSize = this.localStorage.getItem('logBatchSize');
      return logBatchSize !== null ? parseInt(logBatchSize) : 20;
    }
  }

}
