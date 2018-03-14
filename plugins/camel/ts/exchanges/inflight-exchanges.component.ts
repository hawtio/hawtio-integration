/// <reference path="exchanges.service.ts"/>

namespace Camel {

  export class InflightExchangesController {
    readonly reloadDelay = 10000;
    exchanges: any[] = null;
    promise: ng.IPromise<any>;

    constructor(private $timeout: ng.ITimeoutService, private exchangesService: ExchangesService) {
      'ngInject';
    }

    $onInit() {
      this.loadDataPeriodically();
    }

    $onDestroy() {
      this.cancelTimer();
    }

    loadDataPeriodically() {
      this.exchangesService.getInflightExchanges()
        .then(exchanges => this.exchanges = exchanges)
        .then(() => this.promise = this.$timeout(() => this.loadDataPeriodically(), this.reloadDelay));
    }
    
    cancelTimer() {
      this.$timeout.cancel(this.promise);
    }
  }

  export const inflightExchangesComponent: angular.IComponentOptions = {
    template: `
      <h3>Inflight</h3>
      <p ng-if="$ctrl.exchanges === null">Loading...</p>
      <p ng-if="$ctrl.exchanges.length === 0">No inflight exchanges</p>
      <div ng-if="$ctrl.exchanges.length > 0">
        <table class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Exchange ID</th>
              <th>Route ID</th>
              <th>Node ID</th>
              <th>Duration (ms)</th>
              <th>Elapsed (ms)</th>
            </tr>
          </thead>
          <tbody>
            <tr ng-repeat="exchange in $ctrl.exchanges track by exchange.exchangeId">
              <td>{{exchange.exchangeId}}</td>
              <td>{{exchange.routeId}}</td>
              <td>{{exchange.nodeId}}</td>
              <td>{{exchange.duration}}</td>
              <td>{{exchange.elapsed}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    controller: InflightExchangesController
  };

}
