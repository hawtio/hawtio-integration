/// <reference path="profile.service.ts"/>

namespace Camel {

  export class ProfileController {
    readonly reloadDelay = 10000;
    reloadTask: ng.IPromise<any>;
    profile: any[];

    constructor(private $interval: ng.IIntervalService, private profileService: ProfileService) {
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
      this.profileService.getProfile()
        .then(profile => this.profile = profile);
    }

    cancelReloadTask() {
      const successfullyCancelled = this.$interval.cancel(this.reloadTask);
      if (!successfullyCancelled) {
        log.error('Failed to cancel Profile reload task');
      }
    }
  }

  export const profileComponent: angular.IComponentOptions = {
    template: `
      <h2>Profile</h2>
      <p ng-if="!$ctrl.profile">Loading...</p>
      <div ng-if="$ctrl.profile">
        <table class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Count</th>
              <th>Last</th>
              <th>Delta</th>
              <th>Mean</th>
              <th>Min</th>
              <th>Max</th>
              <th>Total</th>
              <th>Self</th>
            </tr>
          </thead>
          <tbody>
            <tr ng-repeat="item in $ctrl.profile track by item.id">
              <td>{{ item.id }}</td>
              <td class="text-right">{{ item.count }}</td>
              <td class="text-right">{{ item.last }}</td>
              <td class="text-right">{{ item.delta }}</td>
              <td class="text-right">{{ item.mean }}</td>
              <td class="text-right">{{ item.min }}</td>
              <td class="text-right">{{ item.max }}</td>
              <td class="text-right">{{ item.total }}</td>
              <td class="text-right">{{ item.self }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    controller: ProfileController
  };

}
