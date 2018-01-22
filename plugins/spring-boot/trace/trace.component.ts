/// <reference path="trace.service.ts"/>

namespace SpringBoot {

  export class TraceController {

    private static CACHE_SIZE: number = 500;

    private toolbarConfig = {
      isTableView: true,
      filterConfig: {
        fields: [
          {
            id: 'timestamp',
            title: 'Timestamp',
            placeholder: 'Filter by timestamp...',
            filterType: 'text'
          },
          {
            id: 'status',
            title: 'HTTP Status',
            placeholder: 'Filter by HTTP status...',
            filterType: 'text'
          },
          {
            id: 'method',
            title: 'HTTP Method',
            placeholder: 'Filter by HTTP method...',
            filterType: 'select',
            filterValues: ['GET', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE']
          },
          {
            id: 'path',
            title: 'Path',
            placeholder: 'Filter by path...',
            filterType: 'text'
          },
          {
            id: 'timeTaken',
            title: 'Time Taken',
            placeholder: 'Filter by time taken...',
            filterType: 'number'
          },
        ],
        onFilterChange: (filters: any[]) => {
          this.applyFilters(filters);
        },
        appliedFilters: [],
        resultsCount: 0
      },
    };

    loading = true;

    traces: Trace[] = [];

    tableItems: Trace[] = [];

    selectedTrace: Trace;

    promise: ng.IPromise<any>;

    dateFormat: string = "yyyy-MM-dd HH:mm:ss.sss";

    constructor(private traceService: TraceService,
                private $scope,
                private $filter: ng.IFilterService,
                private $timeout: ng.ITimeoutService,
                private $interval: ng.IIntervalService,
                private $uibModal) {
      'ngInject';
    }

    $onInit() {
      this.loadTraces();
      this.promise = this.$interval(() => this.loadTraces(), 10000);
    }

    $onDestroy() {
      this.$interval.cancel(this.promise);
    }

    loadTraces() {
      this.loading = true;

      this.traceService.getTraces()
        .then(traces => {
          this.traces.unshift(...this.aggregateTraces(traces));

          if (this.traces.length > TraceController.CACHE_SIZE) {
            let spliceFrom = (this.traces.length) - (this.traces.length - TraceController.CACHE_SIZE)
            let splitAmount = this.traces.length - TraceController.CACHE_SIZE
            this.traces.splice(spliceFrom, splitAmount);
          }

          this.applyFilters(this.toolbarConfig.filterConfig.appliedFilters);
          this.scrollIfRequired();
          this.loading = false;
        });
    }

    applyFilters(filters: any[]) {
      let filteredTraces = this.traces;
      let dateFilter = this.$filter('date');

      filters.forEach(filter => {
        let regExp = new RegExp(filter.value, 'i');

        switch (filter.id) {
          case 'timestamp':
            filteredTraces = filteredTraces.filter(trace => regExp.test(dateFilter(trace.timestamp, this.dateFormat)));
            break;
          case 'status':
            filteredTraces = filteredTraces.filter(trace => parseInt(filter.value) === trace.httpStatusCode);
            break;
          case 'method':
            filteredTraces = filteredTraces.filter(trace => regExp.test(trace.method));
            break;
          case 'path':
            filteredTraces = filteredTraces.filter(trace => regExp.test(trace.path));
            break;
          case 'timeTaken':
            filteredTraces = filteredTraces.filter(trace => parseInt(filter.value) === trace.timeTaken);
            break;
        }
      });

      this.tableItems = filteredTraces;
      this.toolbarConfig.filterConfig.resultsCount = filteredTraces.length;
    }

    getStatusClass(trace: Trace): string {
      if (trace.httpStatusCode) {
        return 'spring-boot-trace-http-status-code-' + Math.floor(trace.httpStatusCode / 100) + 'xx';
      }
      return '';
    }

    openTraceModal(trace: Trace) {
      this.$scope.trace = trace;
      this.$uibModal.open({
        templateUrl: 'traceDetailsModal.html',
        scope: this.$scope,
        size: 'lg',
        appendTo: $(document.querySelector('.spring-boot-trace-main'))
      });
    }

    private aggregateTraces(traces: Trace[]): Trace[] {
      let aggregatedTraces = [];

      traces.forEach(trace => {
        let match = false;
        this.traces.forEach(existingTrace => {
          if (existingTrace.timestamp === trace.timestamp &&
              existingTrace.method === trace.method &&
              existingTrace.path === trace.path) {
            match = true;
            return;
          }
        });

        if (!match) {
          aggregatedTraces.push(trace);
        }
      });

      return aggregatedTraces;
    }

    private scrollIfRequired() {
      let scrollableTable = document.querySelector('.spring-boot-trace-scrollable-table');
      if (scrollableTable !== null && scrollableTable.scrollTop === 0) {
        this.$timeout(() => scrollableTable.scrollTop = 0, 0);
      }
    }
  }

  export const traceComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/spring-boot/trace/trace.html',
    controller: TraceController,
  }
}
