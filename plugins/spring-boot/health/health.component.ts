/// <reference path="health.service.ts"/>
/// <reference path="health.ts"/>

namespace SpringBoot {

  export class HealthController {
    readonly reloadDelay = 20000;
    reloadTask: ng.IPromise<any>;
    health: Health;

    constructor(private $interval: ng.IIntervalService, private healthService: HealthService) {
      'ngInject';
    }

    $onInit() {
      this.loadDataPeriodically();
    }

    $onDestroy() {
      this.cancelReloadTask();
    }

    loadDataPeriodically() {
      this.loadData();
      this.reloadTask = this.$interval(() => this.loadData(), this.reloadDelay);
    }

    loadData() {
      this.healthService.getHealth()
        .then(health => this.health = health);
    }

    cancelReloadTask() {
      const successfullyCancelled = this.$interval.cancel(this.reloadTask);
      if (!successfullyCancelled) {
        log.error('Failed to cancel Health data reload task');
      }
    }
  }

  export const healthComponent: angular.IComponentOptions = {
    template: `
      <div class="spring-boot-health-main">
        <h1>Health</h1>
        <div class="cards-pf" ng-if="$ctrl.health">
          <div class="container-fluid container-cards-pf">
            <div class="row row-cards-pf">
              <div class="col-lg-12">
                <pf-info-status-card status="$ctrl.health.global" show-top-border="true"></pf-info-status-card>
              </div>
              <div class="col-lg-12" ng-repeat="item in $ctrl.health.details">
                <pf-info-status-card status="item" html-content="true"></pf-info-status-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    controller: HealthController
  }

}
