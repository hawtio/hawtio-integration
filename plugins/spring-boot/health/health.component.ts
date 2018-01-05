namespace SpringBoot {

  export interface HealthItem {
    title: string,
    info: string[]
  }

  export class HealthController {

    dataLoaded = false;
    status: string;
    items: HealthItem[];

    constructor(private $interval: ng.IIntervalService, private jolokiaService: JVM.JolokiaService,
      private humanizeService: Core.HumanizeService) {
      'ngInject';
    }

    $onInit() {
      this.loadData();
      this.$interval(() => this.loadData(), 10000);
    }

    loadData(): void {
      log.debug('Load health data');
      this.jolokiaService.getAttribute('org.springframework.boot:type=Endpoint,name=healthEndpoint', 'Data')
        .then(data => {
          this.status = this.humanizeService.toUpperCase(data.status);
          this.items = this.buildItems(data);
          this.dataLoaded = true;
        });
    }

    buildItems(data): HealthItem[] {
      return _.toPairs(data)
        .filter(pair => _.isObject(pair[1]))
        .map(pair => ({
          title: this.humanizeService.toSentenceCase(pair[0]),
          info: _.toPairs(pair[1]).map(pair => this.humanizeService.toSentenceCase(pair[0]) + ': ' + pair[1])
        }));
    }

    getStatusIcon() {
      switch (this.status) {
        case 'UP':
          return 'pficon-ok'
        case 'FATAL':
          return 'pficon-error-circle-o'
        default:
          return 'pficon-info';
      }
    }

    getStatusClass() {
      switch (this.status) {
        case 'UP':
          return 'alert-success'
        case 'FATAL':
          return 'alert-danger'
        default:
          return 'alert-info';
      }
    }
    
  }

  export const healthComponent: angular.IComponentOptions = {
    template: `
      <div class="spring-boot-health-main" ng-if="$ctrl.dataLoaded">
        <h1>Health</h1>
        <div class="cards-pf">
          <div class="container-fluid container-cards-pf">
            <div class="row row-cards-pf">
              <div class="col-lg-12">
                <div class="toast-pf alert" ng-class="$ctrl.getStatusClass()">
                  <span class="pficon" ng-class="$ctrl.getStatusIcon()"></span>
                  <strong>{{$ctrl.status}}</strong>
                </div>
              </div>
              <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3" ng-repeat="item in $ctrl.items">
                <pf-info-status-card status="item"></pf-info-status-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    controller: HealthController
  }

}