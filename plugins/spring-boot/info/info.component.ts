/// <reference path="info.service.ts"/>
/// <reference path="info.ts"/>

namespace SpringBoot {

  export class InfoController {
    readonly reloadDelay = 20000;
    reloadTask: ng.IPromise<any>;
    info: Info;

    constructor(private $interval: ng.IIntervalService, private infoService: InfoService) {
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
      this.infoService.getInfo()
        .then(info => {
          this.info = info
        });

    }

    cancelReloadTask() {
      const successfullyCancelled = this.$interval.cancel(this.reloadTask);
      if (!successfullyCancelled) {
        log.error('Failed to cancel Info data reload task');
      }
    }
  }

  export const infoComponent: angular.IComponentOptions = {
    template: `
      <div class="spring-boot-info-main">
        <h1>Info</h1>
        <table class="table table-striped table-bordered table-hover">
            <thead>
              <th> Attribute </th>
              <th> Value </th>
            </thead>
          <tbody>
            <tr ng-repeat = "item in $ctrl.info.global">
              <td> {{item[0]}} </td>
              <td> {{item[1]}} </td>
            </tr>
          </tbody>
        </table>
      </div>

    `,
    controller: InfoController
  }

}
