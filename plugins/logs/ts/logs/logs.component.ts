/// <reference path="logs.service.ts"/>
/// <reference path="log-entry.ts"/>

namespace Logs {

  const UPDATE_INTERVAL_MILLIS = 5000;

  export class LogsController {
    logs = [];
    filteredLogs = [];
    messageSearchText = [];
    toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'level',
            title: 'Level',
            placeholder: 'Filter by level...',
            filterType: 'select',
            filterValues: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
          },
          {
            id: 'logger',
            title:  'Logger',
            placeholder: 'Filter by logger...',
            filterType: 'text'
          },
          {
            id: 'message',
            title:  'Message',
            placeholder: 'Filter by message...',
            filterType: 'text'
          },
          {
            id: 'properties',
            title:  'Properties',
            placeholder: 'Filter by properties...',
            filterType: 'text'
          }
        ],
        totalCount: this.logs.length,
        resultsCount: this.filteredLogs.length,
        appliedFilters: [],
        onFilterChange: filters => this.applyFilters(filters)
      },
      isTableView: true
    }
    scrollableTable = null;

    constructor(private $timeout, private $uibModal, private logsService: LogsService) {
      'ngInject';
    }

    $onInit() {
      this.scrollableTable = document.querySelector('.log-jmx-scrollable-table');
      this.logsService.getInitialLogs()
        .then(response => this.processLogEntries(response));
    }

    applyFilters(filters) {
      let tableScrolled = this.isTableScrolled();

      this.removePreviousLevelFilter(filters);
      this.messageSearchText = this.getMessageFilterValues(filters);
      this.filteredLogs = this.logsService.filterLogs(this.logs, this.toolbarConfig.filterConfig);

      if (tableScrolled) {
        this.scrollTable();
      }
    }

    removePreviousLevelFilter(filters: any[]) {
      _.remove(filters, (filter, index) => filter.id === 'level' && index < filters.length - 1 &&
        filters[filters.length - 1].id === 'level');
    }

    getMessageFilterValues(filters: any[]) {
      return filters.filter(filter => filter.id === 'message').map(filter => filter.value);
    };

    openLogModal(logEntry: LogEntry) {
      this.$uibModal.open({
        component: 'logModal',
        size: 'lg',
        resolve: {logEntry: logEntry}
      });
    }

    processLogEntries(response) {
      if (response.logEntries.length > 0) {
        let tableScrolled = this.isTableScrolled();

        this.logsService.appendLogs(this.logs, response.logEntries);
        this.filteredLogs = this.logsService.filterLogs(this.logs, this.toolbarConfig.filterConfig);

        if (tableScrolled) {
          this.scrollTable();
        }
      }
      this.scheduleNextRequest(response.toTimestamp);
    }

    scheduleNextRequest(fromTimestamp: number) {
      this.$timeout(() => {
        this.logsService.getMoreLogs(fromTimestamp)
          .then(response => this.processLogEntries(response));
      }, UPDATE_INTERVAL_MILLIS);
    }

    isTableScrolled() {
      if (this.logsService.isLogSortAsc()) {
        return this.scrollableTable.scrollHeight - this.scrollableTable.scrollTop === this.scrollableTable.clientHeight;
      } else {
        return this.scrollableTable.scrollTop === 0;
      }
    }

    scrollTable() {
      if (this.logsService.isLogAutoScroll()) {
        if (this.logsService.isLogSortAsc()) {
          this.$timeout(() => this.scrollableTable.scrollTop = this.scrollableTable.scrollHeight - this.scrollableTable.clientHeight, 0);
        } else {
          this.$timeout(() => this.scrollableTable.scrollTop = 0, 0);
        }
      }
    }
  }

  export const logsComponent: angular.IComponentOptions = {
    template: `
      <div class="log-jmx-main">
        <div class="log-jmx-flex-container">
          <div class="log-jmx-fixed-toolbar">
            <h1>Logs</h1>
            <p ng-show="$ctrl.logs.length === 0">Loading...</p>
            <div ng-show="$ctrl.logs.length > 0">
              <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
              <table class="table table-striped log-jmx-header-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Level</th>
                    <th>Logger</th>
                    <th>Message</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
          <div class="log-jmx-scrollable-table" ng-show="$ctrl.logs.length > 0">
            <table class="table table-striped">
              <tbody>
                <tr ng-repeat="logEntry in $ctrl.filteredLogs">
                  <td>{{logEntry | logDateFilter}}</td>
                  <td class="{{logEntry.levelClass}}">{{logEntry.level}}</td>
                  <td ng-switch="logEntry.hasLogSourceHref">
                    <a href="" ng-switch-when="true" ng-click="$ctrl.openLogModal(logEntry)">{{logEntry.logger}}</a>
                    <span ng-switch-default>{{logEntry.logger}}</span>
                  </td>
                  <td ng-bind-html="logEntry.sanitizedMessage | highlight:$ctrl.messageSearchText"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    controller: LogsController
  };

}
