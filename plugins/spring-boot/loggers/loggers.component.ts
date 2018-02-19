/// <reference path="loggers.service.ts"/>
/// <reference path="logger.ts"/>

namespace SpringBoot {

  export class LoggersController {

    private filterFields = [
      {
        id: 'name',
        title: 'Logger Name',
        placeholder: 'Filter by logger name...',
        filterType: 'text'
      },
      {
        id: 'level',
        title: 'Log Level',
        placeholder: 'Filter by log level...',
        filterType: 'select',
        filterValues: []
      }
    ];

    private filterConfig = {
      fields: this.filterFields,
      onFilterChange: (filters: any[]) => {
        this.applyFilters(filters);
      },
      appliedFilters: [],
      resultsCount: 0
    };

    private toolbarConfig = {
      filterConfig: this.filterConfig,
      isTableView: false
    };

    private pageSize: number = 10;

    private pageNumber: number = 1;

    private numTotalItems: number;

    loading = true;

    loggers: Logger[] = [];

    tableItems: Logger[] = [];

    loggerLevels: string[];

    constructor(private loggersService: LoggersService) {
      'ngInject';
    }

    $onInit() {
      this.loadData();
    }

    loadData(): void {
      this.loggersService.getLoggerConfiguration().then((logConfiguration) => {
        this.loggers = logConfiguration.loggers;
        this.loggerLevels = logConfiguration.levels;
        this.tableItems = logConfiguration.loggers;

        this.filterConfig.resultsCount = logConfiguration.loggers.length;
        this.filterFields[1]['filterValues'] = logConfiguration.levels;

        this.numTotalItems = this.tableItems.length;

        if (this.filterConfig.appliedFilters.length > 0) {
          this.applyFilters(this.filterConfig.appliedFilters);
        }

        this.loading = false;
      }).catch(error => Core.notification('danger', error));
    }

    setLoggerLevel(logger: Logger) {
      this.loggersService.setLoggerLevel(logger).then(() => {
        this.loadData();
      }).catch(error => Core.notification('danger', error));
    }

    applyFilters(filters: any[]) {
      let filteredLoggers = this.loggers;

      filters.forEach(filter => {
        let regExp = new RegExp(filter.value, 'i');
        switch (filter.id) {
          case 'name':
            filteredLoggers = filteredLoggers.filter(logger => logger.name.match(regExp) !== null);
            break;
          case 'level':
            filteredLoggers = filteredLoggers.filter(logger => logger.effectiveLevel.match(regExp) !== null);
            break;
        }
      });

      this.tableItems = filteredLoggers;
      this.numTotalItems = filteredLoggers.length;
      this.toolbarConfig.filterConfig.resultsCount = filteredLoggers.length;
    }

    private orderLoggers(item: Logger): any {
      if (item.name === 'ROOT') {
        return -1;
      }
      else return item.name;
    }
  }

  export const loggersComponent: angular.IComponentOptions = {
    template: `
      <div class="spring-boot-loggers-main">
        <h1>Loggers</h1>
        <div class="blank-slate-pf no-border" ng-if="$ctrl.loading === false && $ctrl.loggers.length === 0">
          <div class="blank-slate-pf-icon">
            <span class="pficon pficon pficon-warning-triangle-o"></span>
          </div>
          <h1>No Spring Boot Loggers</h1>
          <p>There are no loggers to display for this application.</p>
          <p>Check your Spring Boot logging configuration.</p>
        </div>
        <div ng-show="$ctrl.loggers.length > 0">
          <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
          <ul class="list-group spring-boot-loggers-list-group">
            <li class="list-group-item"
                ng-repeat="item in $ctrl.tableItems | orderBy : $ctrl.orderLoggers | startFrom:($ctrl.pageNumber - 1) * $ctrl.pageSize | limitTo: $ctrl.pageSize">
                <div title="Logger Level">
                  <select ng-model="item.configuredLevel"
                          ng-options="level for level in $ctrl.loggerLevels"
                          ng-change="$ctrl.setLoggerLevel(item)"
                          ng-selected="item.effectiveLevel === level">
                  </select>
                </div>
                <div class="list-group-item-heading">{{item.name}}</div>
            </li>
          </ul>
          <pf-pagination
            page-size="$ctrl.pageSize"
            page-number="$ctrl.pageNumber"
            num-total-items="$ctrl.numTotalItems">
          </pf-pagination>
        </div>
      </div>
    `,
    controller: LoggersController
  }

}
