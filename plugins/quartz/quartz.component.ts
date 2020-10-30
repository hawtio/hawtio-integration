namespace Quartz {

  export class QuartzNavController {
    tabs: Nav.HawtioTab[];

    constructor(private $location: ng.ILocationService) {
      'ngInject';
    }

    $onInit() {
      this.tabs = [];
      this.tabs.push(new Nav.HawtioTab('Scheduler', '/quartz/scheduler'));
      this.tabs.push(new Nav.HawtioTab('Triggers', '/quartz/triggers'));
      this.tabs.push(new Nav.HawtioTab('Jobs', '/quartz/jobs'));
    }

    goto(tab: Nav.HawtioTab): void {
      this.$location.path(tab.path);
    }
  }

  export const quartzComponent: angular.IComponentOptions = {
    template: `
      <div class="tree-nav-layout">
        <div class="sidebar-pf sidebar-pf-left" resizable r-directions="['right']">
          <quartz-tree></quartz-tree>
        </div>
        <div class="tree-nav-main">
          <div class="nav-tabs-main">
            <hawtio-tabs tabs="$ctrl.tabs" on-change="$ctrl.goto(tab)"></hawtio-tabs>
            <div class="contents" ng-view></div>
          </div>
        </div>
      </div>
    `,
    controller: QuartzNavController
  };

}
