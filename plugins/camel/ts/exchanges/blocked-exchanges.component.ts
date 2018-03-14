/// <reference path="exchanges.service.ts"/>

namespace Camel {

  export class BlockedExchangesController {
    readonly reloadDelay = 10000;
    exchanges: any[] = null;
    promise: ng.IPromise<any>;

    constructor(private $timeout: ng.ITimeoutService, private $uibModal, private exchangesService: ExchangesService) {
      'ngInject';
    }

    $onInit() {
      this.loadDataPeriodically();
    }

    $onDestroy() {
      this.cancelTimer();
    }

    loadDataPeriodically() {
      this.exchangesService.getBlockedExchanges()
        .then(exchanges => this.exchanges = exchanges)
        .then(() => this.promise = this.$timeout(() => this.loadDataPeriodically(), this.reloadDelay));
    }
    
    cancelTimer() {
      this.$timeout.cancel(this.promise);
    }

    unblock(exchange) {
      this.$uibModal.open({
        component: 'confirmUnblockExchange'
      })
      .result.then(() => {
        this.exchangesService.unblockExchange(exchange)
          .then(() => {
            this.cancelTimer();
            this.loadDataPeriodically();
          });
      });
    }
  }

  export const blockedExchangesComponent: angular.IComponentOptions = {
    template: `
      <h3>Blocked</h3>
      <p ng-if="$ctrl.exchanges === null">Loading...</p>
      <p ng-if="$ctrl.exchanges.length === 0">No blocked exchanges</p>
      <div ng-if="$ctrl.exchanges.length > 0">
        <table class="table table-striped table-bordered dataTable">
          <thead>
            <tr>
              <th>Exchange ID</th>
              <th>Route ID</th>
              <th>Node ID</th>
              <th>Duration (ms)</th>
              <th>Thread ID</th>
              <th>Thread name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr ng-repeat="exchange in $ctrl.exchanges track by exchange.exchangeId">
              <td>{{exchange.exchangeId}}</td>
              <td>{{exchange.routeId}}</td>
              <td>{{exchange.nodeId}}</td>
              <td>{{exchange.duration}}</td>
              <td>{{exchange.id}}</td>
              <td>{{exchange.name}}</td>
              <td class="table-view-pf-actions">
                <div class="table-view-pf-btn">
                  <button type="button" class="btn btn-default" ng-click="$ctrl.unblock(exchange)">Unblock</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    controller: BlockedExchangesController
  };

}
