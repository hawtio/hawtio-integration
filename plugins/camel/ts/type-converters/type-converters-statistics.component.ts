/// <reference path="type-converters.service.ts"/>
/// <reference path='type-converters-statistics.ts'/>

namespace Camel {

  export class TypeCovertersStatisticsController {
    reloadDelay = 10000;
    statistics: TypeConvertersStatistics;
    promise;
    
    enableStatisticsAction = {
      name: 'Enable statistics',
      actionFn: () => this.enableStatistics()
    };
    
    disableStatisticsAction = {
      name: 'Disable statistics',
      actionFn: () => this.disableStatistics()
    };
    
    resetStatisticsAction = {
      name: 'Reset statistics',
      actionFn: () => this.resetStatistics(),
      isDisabled: true
    };
    
    toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          this.enableStatisticsAction,
          this.resetStatisticsAction
        ]
      }
    };

    constructor(private $timeout: ng.ITimeoutService, private typeConvertersService: TypeConvertersService) {
      'ngInject';
    }

    enableStatistics() {
      this.typeConvertersService.enableStatistics();
      this.loadDataPeriodically();
      this.showDisableStatisticsButton();
    }
    
    showDisableStatisticsButton() {
      this.toolbarConfig.actionsConfig.primaryActions[0] = this.disableStatisticsAction;
      this.resetStatisticsAction.isDisabled = false;
    }
    
    disableStatistics() {
      this.cancelTimer();
      this.typeConvertersService.disableStatistics();
      this.showEnableStatisticsButton();
    }
    
    showEnableStatisticsButton() {
      this.toolbarConfig.actionsConfig.primaryActions[0] = this.enableStatisticsAction;
      this.resetStatisticsAction.isDisabled = true;
      this.statistics = null;
    }

    resetStatistics() {
      this.typeConvertersService.resetStatistics();
      this.statistics.reset();
    }

    $onDestroy() {
      this.cancelTimer();
    }

    loadDataPeriodically() {
      this.typeConvertersService.getStatistics()
        .then(statistics => this.statistics = statistics)
        .then(() => this.promise = this.$timeout(() => this.loadDataPeriodically(), this.reloadDelay));
    }

    cancelTimer() {
      this.$timeout.cancel(this.promise);
    }
  }

  export const typeConvertersStatisticsComponent: angular.IComponentOptions = {
    template: `
      <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
      <dl class="dl-horizontal camel-type-converters-statistics">
        <dt>Attempts</dt>
        <dd>{{$ctrl.statistics ? $ctrl.statistics.AttemptCounter : '-'}}</dd>
        <dt>Hits</dt>
        <dd>{{$ctrl.statistics ? $ctrl.statistics.HitCounter : '-'}}</dd>
        <dt>Misses</dt>
        <dd>{{$ctrl.statistics ? $ctrl.statistics.MissCounter : '-'}}</dd>
        <dt>Failures</dt>
        <dd>{{$ctrl.statistics ? $ctrl.statistics.FailedCounter : '-'}}</dd>
      </dl>
    `,
    controller: TypeCovertersStatisticsController
  };

}
